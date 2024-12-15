"use strict";

import { readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path/posix";
import { XMLParser } from "fast-xml-parser";
import { stringify } from "yaml";

import { logger } from "@src/index";
import { XML_PARSER_OPTION, XmlElement } from "@src/helpers/types";

export async function transform2YAML(xmlPath: string): Promise<void> {
  const subFiles = await readdir(xmlPath);
  for (const subFile of subFiles) {
    const subFilePath = join(xmlPath, subFile);
    if ((await stat(subFilePath)).isDirectory()) {
      await transform2YAML(subFilePath);
    } else if (
      (await stat(subFilePath)).isFile() &&
      subFilePath.endsWith(".xml")
    ) {
      await writeYAML(subFilePath);
      await rm(subFilePath);
    }
  }
}

async function writeYAML(xmlPath: string): Promise<void> {
  const xmlParser = new XMLParser(XML_PARSER_OPTION);
  const xmlContent = await readFile(xmlPath, "utf-8");
  const xmlParsed = xmlParser.parse(xmlContent, true) as Record<
    string,
    XmlElement
  >;
  const yamlString = stringify(xmlParsed);
  const yamlPath = xmlPath.replace(/\.xml$/, ".yaml");
  await writeFile(yamlPath, yamlString);
  logger.debug(`${xmlPath} has been transformed into ${yamlPath}`);
}
