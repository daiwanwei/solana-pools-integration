{ rustToolchain
, cargoArgs
, unitTestArgs
, pkgs
, lib
, stdenv
, darwin
, libiconv
, ...
}:

let
  cargo-ext = pkgs.callPackage ./cargo-ext.nix { inherit cargoArgs unitTestArgs; };
in
pkgs.mkShell {
  name = "dev-shell";

  buildInputs = lib.optionals stdenv.isDarwin [
    darwin.apple_sdk.frameworks.Security
    darwin.apple_sdk.frameworks.SystemConfiguration
    libiconv
  ];

  nativeBuildInputs = with pkgs; [
    # Rust tools
    cargo-ext.cargo-build-all
    cargo-ext.cargo-clippy-all
    cargo-ext.cargo-doc-all
    cargo-ext.cargo-nextest-all
    cargo-ext.cargo-test-all
    cargo-nextest
    rustToolchain

    # Solana tools
    solana-cli
    anchor

    # formatters
    nixpkgs-fmt
    nodePackages.prettier
    shfmt
    taplo
    treefmt

    # linters
    shellcheck

    # miscellaneous
    tokei

    jq
  ];

  shellHook = ''
    export NIX_PATH="nixpkgs=${pkgs.path}"
  '';
}
