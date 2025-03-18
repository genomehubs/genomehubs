const fs = require("fs");

// list files in current working directory
const listFiles = async (dirPath = "./") => {
  return await fs.promises
    .readdir(dirPath, { withFileTypes: true })
    .then((files) =>
      files.filter((file) => file.isFile()).map((file) => file.name)
    );
};

listFiles().then(console.log);
