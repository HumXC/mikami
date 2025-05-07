{
  mikami,
  mika-shell-frontend,
  lib,
  stdenvNoCC,
  gsettings-desktop-schemas,
  glib-networking,
  gtk3,
  makeWrapper,
  webkitgtk_4_1,
  gtk-layer-shell,
  ...
}:
stdenvNoCC.mkDerivation {
  pname = "mika-shall";
  version = "0.0.1";
  src = mika-shell-frontend.out;
  nativeBuildInputs = [mikami makeWrapper];
  buildInputs = [webkitgtk_4_1 gtk-layer-shell];
  buildPhase = ''
    mikami bundle $src/share/mika-shell-frontend mika-shell "HumXC/mika-shell"
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp ./mika-shell $out/bin/mika-shell
    chmod +x $out/bin/mika-shell
  '';
  # https://wails.io/docs/guides/nixos-font/
  postFixup = ''
    wrapProgram $out/bin/mika-shell \
      --set XDG_DATA_DIRS ${gsettings-desktop-schemas}/share/gsettings-schemas/${gsettings-desktop-schemas.name}:${gtk3}/share/gsettings-schemas/${gtk3.name}:$XDG_DATA_DIRS \
      --set GIO_MODULE_DIR ${glib-networking}/lib/gio/modules/
  '';
  meta = {
    description = "mika-shell is a frontend for the mikami project";
    homepage = "https://github.com/HumXC/mika-shell";
    license = lib.licenses.mit;
  };
}
