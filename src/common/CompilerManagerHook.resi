open RescriptCompilerApi

module FinalResult: {
  /* A final result is the last operation the compiler has done, right now this includes... */
  type t =
    | Conv(ConversionResult.t)
    | Comp(CompilationResult.t)
    | Nothing
}

type selected = {
  id: Semver.t, // The id used for loading the compiler bundle (ideally should be the same as compilerVersion)
  apiVersion: Version.t, // The playground API version in use
  compilerVersion: string,
  ocamlVersion: option<string>,
  libraries: array<string>,
  config: Config.t,
  instance: Compiler.t,
}

type ready = {
  code: string,
  versions: array<Semver.t>,
  selected: selected,
  targetLang: Lang.t,
  errors: array<string>, // For major errors like bundle loading
  result: FinalResult.t,
}

type state =
  | Init
  | SetupFailed(string)
  | SwitchingCompiler(ready, Semver.t) // (ready, targetId, libraries)
  | Ready(ready)
  | Compiling(ready, (Lang.t, string))

type action =
  | SwitchToCompiler(Semver.t) // id
  | SwitchLanguage({lang: Lang.t, code: string})
  | Format(string)
  | CompileCode(Lang.t, string)
  | UpdateConfig(Config.t)

let useCompilerManager: (
  ~initialVersion: Semver.t=?,
  ~initialModuleSystem: string=?,
  ~initialLang: Lang.t=?,
  ~onAction: action => unit=?,
  ~versions: array<Semver.t>,
  unit,
) => (state, action => unit)

let createUrl: (string, ready) => string
