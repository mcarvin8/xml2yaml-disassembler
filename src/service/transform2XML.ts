"use strict";

import { readFile, writeFile } from "node:fs/promises";
import { buildXMLString } from "xml-disassembler";
import { parse } from "yaml";

import { logger } from "@src/index";

export async function transform2XML(
  yamlPath: string,
  indentLevel: number = 0,
): Promise<void> {
  const yamlString = await readFile(yamlPath, "utf-8");
  const jsObject = parse(yamlString);

  // Remove XML declaration from JSON string
  const formattedXml = buildXMLString(jsObject, indentLevel);

  const xmlPath = yamlPath.replace(/\.yaml$/, ".xml");
  await writeFile(xmlPath, formattedXml);
  logger.debug(`${yamlPath} has been transformed into ${xmlPath}`);
}
