import fs from "fs";
import ytdl from "ytdl-core";
import inquirer from "inquirer";

inquirer
  .prompt([
    {
      message: "Video URL : ",
      name: "URL",
    },
    {
      message: "File Name : ",
      name: "fileName",
    },
  ] as any)
  .then((answers) => {
    const url = answers.URL;
    const fileName = answers.fileName;

    ytdl.getInfo(url).then((info) => {
      let videoTitle = info.videoDetails.title;
      console.log(videoTitle);
    });

    ytdl(url).pipe(fs.createWriteStream("video1.mp4"));

    fs.writeFile("URL.txt", url, (err) => {
      if (err) throw err;
      console.log("The File has Been Saved");
    });
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });
