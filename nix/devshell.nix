{
  lib,
  pkgs,
  mkShell,
  pkg-config,
  zig,
  zls,
  gtk4,
  webkitgtk_6_0,
  gtk4-layer-shell,
  zlib,
  glib-networking,
  openssl,
  devhelp,
  ...
}: let
  # zig 不支持 -mfpmath=sse 选项
  custom-pkg-config = pkgs.writeScriptBin "pkg-config" ''
    #!/usr/bin/env bash
    exec ${pkgs.pkg-config}/bin/pkg-config "$@" | sed 's/-mfpmath=sse//g'
  '';
  docs = lib.makeSearchPathOutput "devdoc" "share" [
    gtk4
    webkitgtk_6_0
  ];
in
  mkShell {
    buildInputs = [
      custom-pkg-config
      pkg-config
      zig
      zls
      gtk4-layer-shell
      zlib
      openssl
      glib-networking
      gtk4
      webkitgtk_6_0
      devhelp
    ];
    GIO_EXTRA_MODULES = "${glib-networking.out}/lib/gio/modules";
    shellHook = ''
      export XDG_DATA_DIRS=${docs}:$XDG_DATA_DIRS
    '';
  }
