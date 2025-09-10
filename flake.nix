{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    mika-shell.url = "github:HumXC/mika-shell";
  };

  outputs = {
    nixpkgs,
    mika-shell,
    ...
  }: let
    forAllSystems = nixpkgs.lib.genAttrs [
      "aarch64-linux"
      "x86_64-linux"
    ];
  in {
    packages = forAllSystems (system: let
      pkgs = import nixpkgs {inherit system;};
      frontend = pkgs.callPackage ./nix/package-frontend.nix {};
      mika-shell-frontend = pkgs.callPackage ./nix/package.nix {
        mika-shell-frontend = frontend;
      };
    in {
      default = mika-shell-frontend;
    });
    devShells = forAllSystems (system: let
      pkgs = import nixpkgs {inherit system;};
    in {
      default = pkgs.mkShell {
        buildInputs = with pkgs;
          [
            nodejs
            tailwindcss
            tailwindcss-language-server
            vue-language-server
          ]
          ++ [
            mika-shell.packages.${system}.debug
          ];
        MIKASHELL_CONFIG_DIR = "./config";
        GST_PLUGIN_SYSTEM_PATH_1_0 = with pkgs;
          lib.makeSearchPathOutput "lib" "lib/gstreamer-1.0" [
            gst_all_1.gst-plugins-base
            gst_all_1.gst-plugins-good
            gst_all_1.gst-plugins-bad
            gst_all_1.gst-plugins-ugly
            gst_all_1.gst-libav
            gst_all_1.gstreamer
          ];
      };
    });
  };
  nixConfig = {
    # substituers will be appended to the default substituters when fetching packages
    extra-substituters = [
      "https://cache.garnix.io"
    ];
    extra-trusted-public-keys = [
      "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g="
    ];
  };
}
