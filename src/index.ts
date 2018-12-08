"use strict";

import { terminal } from "./environment";
import { Program } from "./program";

let program = new Program(terminal);

let window = program.newWindow(0, 0, "Program");

export { terminal, program };
