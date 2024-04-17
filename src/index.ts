import { getLogger, configure } from "log4js";
export { XmlToYamlDisassembler } from "./service/xml2yamlDisassembler";
export { YamlToXmlReassembler } from "./service/yaml2xmlReassembler";

export const logger = getLogger();

export function setLogLevel(level: string) {
  getLogger().level = level;
}

configure({
  appenders: { disassemble: { type: "file", filename: "disassemble.log" } },
  categories: { default: { appenders: ["disassemble"], level: "error" } },
});
