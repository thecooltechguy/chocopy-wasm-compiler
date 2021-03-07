import { Type } from "../ast";
import { NUM, STRING, BOOL, NONE, unhandledTag } from "../utils";
import { nTagBits } from "../compiler";

function stringify(typ: Type, arg: any): string {
  switch (typ.tag) {
    case "number":
      var num: number = arg as number;
      if (num & 1) {
        // literals are tagged with 1 in the LSB
        return (num >> nTagBits).toString();
      } else {
        return num.toString(); // bigint case, num is an address
      }
    case "string":
      if (arg == -1) throw new Error("String index out of bounds");
      const view = new Int32Array(importObject.js.memory.buffer);
      let string_length = view[arg / 4] + 1;
      arg = arg + 4;
      var i = 0;
      var full_string = "";
      while (i < string_length) {
        let ascii_val = view[arg / 4 + i];
        var char = String.fromCharCode(ascii_val);
        full_string += char;
        i += 1;
      }
      return full_string;
    case "bool":
      return (arg as number) >> nTagBits == 1 ? "True" : "False";
    case "none":
      return "None";
    case "class":
      return typ.name;
  }
}

function print(typ: Type, arg: any): any {
  importObject.output += stringify(typ, arg);
  importObject.output += "\n";
  return arg;
}

const memory = new WebAssembly.Memory({ initial: 2000, maximum: 2000 });
const view = new Int32Array(memory.buffer);
view[0] = 4;
var memory_js = { memory: memory };

export const importObject = {
  imports: {
    // we typically define print to mean logging to the console. To make testing
    // the compiler easier, we define print so it logs to a string object.
    //  We can then examine output to see what would have been printed in the
    //  console.
    print: (arg: any) => print(NUM, arg),
    print_num: (arg: number) => print(NUM, arg),
    print_str: (arg: number) => print(STRING, arg),
    print_bool: (arg: number) => print(BOOL, arg),
    print_none: (arg: number) => print(NONE, arg),
    abs: function (n: number) {
      return (Math.abs(n >> 1) << 1) + 1;
    },
    min: Math.min,
    max: Math.max,
    pow: Math.pow,
  },
  js: memory_js,
  output: "",
};
