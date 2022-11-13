const CloudConvert = require('cloudconvert');
const fs = require('fs');
const https = require('https')
const path = require('path')
const { exec } = require('child_process');


//API KEY for development
const API_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMWEyYWE1MzhjMjEwNmExNmU2ZjMxZjljYTEwZTBjYTE3MzlmNzBmMGUyNDUwMzdjYWJkZGJkMmEzYWRhNWY4MWVkNDdmYmRhNzVjMDhjOTMiLCJpYXQiOjE2Njc0NDQ1ODcuMDg2OTA0LCJuYmYiOjE2Njc0NDQ1ODcuMDg2OTA2LCJleHAiOjQ4MjMxMTgxODcuMDg0MTcsInN1YiI6IjYwNjI3NzA3Iiwic2NvcGVzIjpbInVzZXIucmVhZCIsInVzZXIud3JpdGUiLCJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIiwid2ViaG9vay5yZWFkIiwid2ViaG9vay53cml0ZSIsInByZXNldC5yZWFkIiwicHJlc2V0LndyaXRlIl19.TY24qCnG0iMWmPDM9n2MoAiPynZ4ol_zFAKojfSjH-i3SwGbhe-bjtXfV2w2wPr42Zy_kOW7sCiBQVSUv5SX7sWYJfEclUGsUnqrgI0SkNUeiHAykRlkRooV1Qz6ZK9WnSuw3zYUbBFA2NZlkeWzBBi9ldgfeR9yI2wEjT_-yRI48RoiJc7NbLAJe9NVGQd3aNqQ5J51C54pGPtuKeyjATwP6o4P067g44T89G2vkBkUuP6TtkwO2di2Euh7-sQXWL8pOEjm4uEIMLGlzKFyNTgFldqVICcaSAVLGt6E-AZcp5Ea6CKAQJqJ5xsaTSeUEht_Cqb2fhDYvX3QhbBSUIrMj-LodB5LctTZRsbgAae7smddL-dm_cCLSQwFDuTj-3OY1xue6gQgIx-Z6RzV_Xeokg1x2SaBK9kWGrHScVpGl0LLt4idKZYz4ISS2K23wxK4UTzzV9HkPyY0Ry80glJfe8NGREVcAsyzSRZFbp5_Y16-xain_m3NY-5kgZSRcQJIVoikOFoP4m_51x3EC2AiOdiGbtvZo7Fg1rPasrr747VqFai9xtX3psgPFXeJB73BqmXc1jNgltJs1ddV3uFuUA_HRGwcZY_wJFshxY_LjOxtWiyxK6FU1kffNpjMPb--LlXcvr8cpNCvEO0Bt1wB8a2CaZXIoOKgORXGRbE'

const cloudConvert = new CloudConvert(process.env.API_SECRET);

 

async function convertSelfToPNG(inputLoc, filename, outputLoc){      //Ini mengggunakan ImageMagisk
    let input = path.resolve(inputLoc)
    let pathOutput = path.join(outputLoc, filename.split(".")[0])

    fs.mkdirSync(pathOutput)
    let command = new Promise((resolve, reject)=>{
        exec(`magick convert -density 150 ${input} -background white -alpha remove -quality 100  ${pathOutput}/${filename.split(".")[0]}.png`, (err, stdout, stdin)=>{
            if (err) return reject(stderr)
            resolve(stdout)
        })
        
    })
    await command
    fs.unlink(input,err=>{
        if (err) return err
        console.log("File Input Deleted")
    })
    return {
        pathOut : pathOutput
    }
}



async function convertToPNG(inputLoc, filename, outputLoc){                 //Ini menggunakan CloudConvert
    let input = path.resolve(inputLoc)
    let pathOutput = path.join(outputLoc, filename.split(".")[0])

    console.log("Converting to PNG.......")                     // Console log Status
    let job = await cloudConvert.jobs.create({
        "tasks": {
            "import-1": {
                "operation": "import/upload"
            },
            "task-1": {
                "operation": "convert",
                "input_format": "pdf",
                "output_format": "png",
                "engine": "graphicsmagick",
                "input": [
                    "import-1"
                ],
                "fit": "max",
                "strip": false,
                "pixel_density": 150,
                "quality": 75,
                "engine_version": "1.3.31"
            },
            "export-1": {
                "operation": "export/url",
                "input": [
                    "task-1"
                ],
                "inline": false,
                "archive_multiple_files": false
            }
        },
        "tag": "jobbuilder"
    });

    const uploadTask = job.tasks.filter(task => task.name === 'import-1')[0];
    const inputFile = fs.createReadStream(input);
    await cloudConvert.tasks.upload(uploadTask, inputFile, filename);           //uploading file

    job = await cloudConvert.jobs.wait(job.id);                                 //wait job to finish
    const file = cloudConvert.jobs.getExportUrls(job);                          //get export link

    fs.mkdirSync(pathOutput)                            //making directory for file

    for(let i=0; i<file.length; i++){                   //downloading file
        let writeStream = fs.createWriteStream(path.join(pathOutput, file[i].filename))
        https.get(file[i].url, function(response) {
            response.pipe(writeStream);
        });
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }
    fs.unlink(input,err=>{
        if (err) return err
        console.log("File Input Deleted")
    })

    return {
        pathOut : pathOutput
    }

}

module.exports = convertSelfToPNG