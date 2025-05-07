{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    mikami.url = "github:HumXC/mikami";
  };

  outputs = {
    nixpkgs,
    mikami,
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
      mika-shell = pkgs.callPackage ./nix/package.nix {
        mikami = mikami.packages.${system}.default;
        mika-shell-frontend = frontend;
      };
    in {
      frontend = frontend;
      default = mika-shell;
    });
    devShells = forAllSystems (system: let
      pkgs = import nixpkgs {inherit system;};
    in {
      default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs
          tailwindcss
          tailwindcss-language-server
          vue-language-server
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
