import { createReadStream, promises as fs } from "fs";

import { config } from "../functions/config.js";
import { getRecordsById } from "../functions/getRecordsById.js";
import { logError } from "../functions/logger.js";

const locateFile = async (params) => {
  let response = await getRecordsById({ ...params, result: "file" });
  let record = response.records[0].record;
  let path = `${config.hubPath}/${record.location}`;
  if (params.preview) {
    if (!record.preview_name) {
      return false;
    }
    let file = `${path}/${record.preview_name}`;
    let fileName = params.filename ? params.filename : record.preview_name;
    try {
      await fs.access(file);
      let fileStream = createReadStream(file);
      return { file, fileStream, fileName, mime: record.preview_mime_type };
    } catch (error) {
      return false;
    }
  }
  if (record.name) {
    let file = `${path}/${record.name}`;
    let fileName = params.filename ? params.filename : record.name;
    try {
      await fs.access(file);
      let fileStream = createReadStream(file);
      return { file, fileStream, fileName, mime: record.mime_type };
    } catch (error) {
      if (params.streamFile) {
        return false;
      } else if (record.url) {
        return { redirect: record.url };
      }
    }
    return false;
  }
};

export const getFile = async (req, res) => {
  try {
    let response = {};
    const q = req.expandedQuery || req.query || {};
    response = await locateFile(q);
    if (response && response != {}) {
      if (response.redirect) {
        return res.redirect(response.redirect);
      }
      res.setHeader("content-type", response.mime);
      if (!q.streamFile) {
        res.attachment(response.fileName);
      }
      return response.fileStream.pipe(res);
    }
    return res.status(404).send();
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
