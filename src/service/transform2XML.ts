"use strict";

import { readFile, writeFile } from "node:fs/promises";
import { XMLBuilder } from "fast-xml-parser";
import { parse } from "yaml";

import { logger } from "@src/index";
import { JSON_PARSER_OPTION, INDENT } from "@src/helpers/types";

export async function transform2XML(
  yamlPath: string,
  indentLevel: number = 0,
): Promise<void> {
  const yamlString = await readFile(yamlPath, "utf-8");
  const jsObject = parse(yamlString);

  // Remove XML declaration from JSON string
  const xmlBuilder = new XMLBuilder(JSON_PARSER_OPTION);
  const xmlString = xmlBuilder.build(jsObject) as string;

  // Manually format the XML string with the desired indentation
  const formattedXml: string = xmlString
    .split("\n")
    .map((line: string) => `${" ".repeat(indentLevel * INDENT.length)}${line}`)
    .join("\n")
    .trimEnd();

  const xmlPath = yamlPath.replace(/\.yaml$/, ".xml");
  await writeFile(xmlPath, formattedXml);
  logger.debug(`${yamlPath} has been transformed into ${xmlPath}`);
}
