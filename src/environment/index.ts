import { Browser } from "./browser";

// This is pretty terrible, but I can't find a better way to do it.
let Enviornment = typeof(process) !== "undefined" ? require("./terminal").Terminal : Browser;

let terminal = new Enviornment();

export { terminal };
