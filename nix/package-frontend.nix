{
  lib,
  buildNpmPackage,
}:
buildNpmPackage {
  pname = "mika-shell-frontend";
  version = "0.0.1";

  src = ../.;

  npmDepsHash = "sha256-tgHVgk07hwnMUHy0dRdf6JIBdRqMMb2WFvyXy0GLaCg=";
  makeCacheWritable = true;
  installPhase = ''
    runHook preInstall

    mkdir -p $out/share
    cp -r dist $out/share/mika-shell-frontend

    runHook postInstall
  '';
  meta = {
    description = "mika-shell-frontend is a frontend for the mikami project";
    homepage = "https://github.com/HumXC/mika-shell";
    license = lib.licenses.mit;
  };
}
