import { Browser } from "./browser";

// This is pretty terrible, but I can't find a better way to do it.
const Environment = typeof(process) !== "undefined" ? require("./terminal").Terminal : Browser;

const terminal = new Environment();

export { terminal };
