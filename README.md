# XML2YAML Disassembler

[![NPM](https://img.shields.io/npm/v/xml2yaml-disassembler.svg?label=xml2yaml-disassembler)](https://www.npmjs.com/package/xml2yaml-disassembler) [![Downloads/week](https://img.shields.io/npm/dw/xml2yaml-disassembler.svg)](https://npmjs.org/package/xml2yaml-disassembler)

A JavaScript package to disassemble then transform XML files into smaller YAML files. This is an extension of my [XML Disassembler](https://github.com/mcarvin8/xml-disassembler) package.

## Background

Large XML files can be a pain to mantain in version control. These files can contain thousands of lines and it becomes very difficult to track changes made to these files in a standard version control server like GitHub.

This package offers a way to break down large XML files into smaller YAML files which can be used to review changes in a format easier to digest. When needed, the inverse class will reassemble the original XML file from the smaller YAML files.

This will parse and retain the following XML elements:

- CDATA sections (`"![CDATA["`)
- Comments (`"!---"`)
- Attributes (`"@__**"`)

## Install

Install the package using NPM:

```
npm install xml2yaml-disassembler
```

## Usage

### XML 2 YAML

```typescript
/* 
FLAGS
- filePath: Relative path to 1 XML file or a directory of XML files to disassemble, then transform into YAML files. If the path provided is a directory, only the files in the immediate directory will be disassembled and transformed.
- uniqueIdElements: (Optional) Comma-separated list of unique and required ID elements used to name disassembled files for nested elements. 
                               Defaults to SHA-256 hash if unique ID elements are undefined or not found.
- prePurge:  (Optional) Boolean value. If set to true, purge pre-existing transformed directories prior to disassembling and transformed the file.
                               Defaults to false.
- postPurge: (Optional) Boolean value. If set to true, purge the original XML file after transforming it into smaller YAML files.
                               Defaults to false.
- ignorePath: (Optional) Path to an ignore file containing XML files to ignore during disassembly. See "Ignore File" section.
*/
import { XmlToYamlDisassembler } from "xml2yaml-disassembler";

const handler = new XmlToYamlDisassembler();
await handler.disassemble({
  filePath: "test/baselines/general",
  uniqueIdElements:
    "application,apexClass,name,externalDataSource,flow,object,apexPage,recordType,tab,field",
  prePurge: true,
  postPurge: true,
  ignorePath: ".xmldisassemblerignore",
});
```

Disassemble then transform 1 or multiple XML files into YAML files. Paths provided must be **relative** paths. If the `filePath` is a directory, only the XMLs in the immediate directory will be processed. Each XML wiill be transformed into YAML files in new sub-directories using the XML's base name (everything before the first period in the file-name).

Example:

An XML file (`HR_Admin.permissionset-meta.xml`) with the following nested and leaf elements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <applicationVisibilities>
        <application>JobApps__Recruiting</application>
        <visible>true</visible>
    </applicationVisibilities>
    <classAccesses>
        <apexClass>Send_Email_Confirmation</apexClass>
        <enabled>true</enabled>
    </classAccesses>
    <fieldPermissions>
        <editable>true</editable>
        <field>Job_Request__c.Salary__c</field>
        <readable>true</readable>
    </fieldPermissions>
    <description>Grants all rights needed for an HR administrator to manage employees.</description>
    <label>HR Administration</label>
    <userLicense>Salesforce</userLicense>
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>true</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <viewAllRecords>true</viewAllRecords>
        <modifyAllRecords>true</modifyAllRecords>
        <object>Job_Request__c</object>
    </objectPermissions>
    <pageAccesses>
        <apexPage>Job_Request_Web_Form</apexPage>
        <enabled>true</enabled>
    </pageAccesses>
    <recordTypeVisibilities>
        <recordType>Recruiting.DevManager</recordType>
        <visible>true</visible>
    </recordTypeVisibilities>
    <tabSettings>
        <tab>Job_Request__c</tab>
        <visibility>Available</visibility>
    </tabSettings>
    <userPermissions>
        <enabled>true</enabled>
        <name>APIEnabled</name>
    </userPermissions>
</PermissionSet>
```

will be disassembled into a sub-directory named `HR_Admin` as such:

- Each nested element (`<recordTypeVisibilities>`, `<applicationVisibilities>`, `pageAccesses`, etc.) will be disassembled into further sub-directories by the nested element name. If a unique & required ID element (`application` is the unique ID element for `<applicationVisibilities>`) is found, the disassembled file will be named using it. Otherwise, the disassembled files for nested elements will be named using the SHA-256 of the element contents.
- Each leaf element (`<description>`, `<label>`, `<userLicense>`) will be disassembled into the same file in the first sub-directory, which will have the same file-name as the original file.

<img src="https://raw.githubusercontent.com/mcarvin8/xml2yaml-disassembler/main/.github/images/disassembled.png">

<br>

<img src="https://raw.githubusercontent.com/mcarvin8/xml2yaml-disassembler/main/.github/images/disassembled-hashes.png">

<br>

### YAML 2 XML

```typescript
/* 
FLAGS
- filePath: Relative path to the directory containing the YAML files to reassemble into 1 XML file (must be a directory).
- fileExtension: (Optional) Desired file extension for the final XML (default: `.xml`).
- postPurge: (Optional) Boolean value. If set to true, purge the disassembled directory containing YAML files after the XML is reassembled.
                               Defaults to false.
*/
import { YamlToXmlReassembler } from "xml2yaml-disassembler";

const handler = new YamlToXmlReassembler();
await handler.reassemble({
  filePath: "test/baselines/HR_Admin",
  fileExtension: "permissionset-meta.xml",
  postPurge: true,
});
```

Reassemble all of the YAML files in a directory into 1 XML file. Path provided must be a **relative** path. **Note:** You should only be reassembling YAML files created by the `XmlToYamlDisassembler` class for intended results. The reassembled XML file will be created in the parent directory of `filePath` and will overwrite the original file used to create the original disassembled directories, if it still exists and the `fileExtension` flag matches the original file extension.

## Ignore File

If you wish, you can create an ignore file to have the disassembler ignore specific XMLs similar to a `.gitignore` file.

The disassembler uses the [node-ignore](https://github.com/kaelzhang/node-ignore) package to parse ignore files that follow [.gitignore spec 2.22.1](https://git-scm.com/docs/gitignore).

By default, the XML disassembler will look for an ignore file named `.xmldisassemblerignore` in the current working directory. Set the `ignorePath` flag to override this ignore path when running the XmlToYamlDisassembler class.

## Logging

By default, the package will not print any debugging statements to the console. Any error or debugging statements will be added to a log file, `disassemble.log`, created in the same directory you are running this package in. This file will be created when running the package in all cases, even if there are no errors. I recommend adding `disassemble.log` to your `.gitignore` file.

This log will include the results of this package and the XML Disassembler package.

**NOTE**: The logging package used, `log4js`, requires `fs-extra` to be installed in your project as a dependency (`npm install --save fs-extra`).

The logger's default state is to only log errors to `disassemble.log`. Check this file for ERROR statements that will look like:

```
[2024-04-17T10:17:11.284] [ERROR] default - The file path C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\not-an-xml.txt is not an XML file.
[2024-04-17T10:17:11.285] [ERROR] default - The path mock/not-an-xml.txt is not a directory.
```

To add additional debugging statements to the log file, import the `setLogLevel` function from the package and run the function with `debug` to print all debugging statements to a log file.

When the log level is set to `debug`, the log file will contain statements like this to indicate which files were processed for disassembly and reassembly:

```
[2024-04-17T10:17:10.974] [DEBUG] default - Parsing file to disassemble: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin.permissionset-meta.xml
[2024-04-17T10:17:10.983] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\applicationVisibilities\JobApps__Recruiting.applicationVisibilities-meta.xml
[2024-04-17T10:17:10.984] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\classAccesses\Send_Email_Confirmation.classAccesses-meta.xml
[2024-04-17T10:17:10.986] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\fieldPermissions\Job_Request__c.Salary__c.fieldPermissions-meta.xml
[2024-04-17T10:17:10.989] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\objectPermissions\Job_Request__c.objectPermissions-meta.xml
[2024-04-17T10:17:10.991] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\pageAccesses\Job_Request_Web_Form.pageAccesses-meta.xml
[2024-04-17T10:17:10.992] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\recordTypeVisibilities\Recruiting.DevManager.recordTypeVisibilities-meta.xml
[2024-04-17T10:17:10.993] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\tabSettings\Job_Request__c.tabSettings-meta.xml
[2024-04-17T10:17:10.995] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\userPermissions\APIEnabled.userPermissions-meta.xml
[2024-04-17T10:17:11.008] [DEBUG] default - Created disassembled file: C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\HR_Admin.permissionset-meta.xml
[2024-04-17T10:17:11.015] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\applicationVisibilities\JobApps__Recruiting.applicationVisibilities-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\applicationVisibilities\JobApps__Recruiting.applicationVisibilities-meta.yaml
[2024-04-17T10:17:11.020] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\classAccesses\Send_Email_Confirmation.classAccesses-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\classAccesses\Send_Email_Confirmation.classAccesses-meta.yaml
[2024-04-17T10:17:11.024] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\fieldPermissions\Job_Request__c.Salary__c.fieldPermissions-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\fieldPermissions\Job_Request__c.Salary__c.fieldPermissions-meta.yaml
[2024-04-17T10:17:11.027] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\HR_Admin.permissionset-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\HR_Admin.permissionset-meta.yaml
[2024-04-17T10:17:11.030] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\objectPermissions\Job_Request__c.objectPermissions-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\objectPermissions\Job_Request__c.objectPermissions-meta.yaml
[2024-04-17T10:17:11.033] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\pageAccesses\Job_Request_Web_Form.pageAccesses-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\pageAccesses\Job_Request_Web_Form.pageAccesses-meta.yaml
[2024-04-17T10:17:11.038] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\recordTypeVisibilities\Recruiting.DevManager.recordTypeVisibilities-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\recordTypeVisibilities\Recruiting.DevManager.recordTypeVisibilities-meta.yaml
[2024-04-17T10:17:11.042] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\tabSettings\Job_Request__c.tabSettings-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\tabSettings\Job_Request__c.tabSettings-meta.yaml
[2024-04-17T10:17:11.045] [DEBUG] default - C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\userPermissions\APIEnabled.userPermissions-meta.xml has been transformed into C:\Users\matthew.carvin\Documents\GitHub\xml2yaml-disassembler\mock\HR_Admin\userPermissions\APIEnabled.userPermissions-meta.yaml
```

```typescript
import {
  XmlToYamlDisassembler,
  YamlToXmlReassembler,
  setLogLevel,
} from "xml2yaml-disassembler";

setLogLevel("debug");

const disassembleHandler = new XmlToYamlDisassembler();
await disassembleHandler.disassemble({
  filePath: "test/baselines/general",
  uniqueIdElements:
    "application,apexClass,name,externalDataSource,flow,object,apexPage,recordType,tab,field",
  prePurge: true,
  postPurge: true,
});

const reassembleHandler = new YamlToXmlReassembler();
await reassembleHandler.reassemble({
  filePath: "test/baselines/HR_Admin",
  fileExtension: "permissionset-meta.xml",
  postPurge: true,
});
```

## Template

This project was created from a template provided by [Allan Oricil](https://github.com/AllanOricil).

His original [license](https://github.com/AllanOricil/js-template/blob/main/LICENSE) remains in this project.
