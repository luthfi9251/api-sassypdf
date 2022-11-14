const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

module.exports = async (inputPath)=>{ 
    let inputDir = path.resolve(inputPath)
    const fileName = path.basename(inputPath)
    const pathToWatermark = "./watermark.png"
    
    console.log("watermark - Giving Watermark.......")                  // Console Log Status

    let watermarking = new Promise((resolve, reject)=>{
        let dirList = fs.readdirSync(inputDir)
        let count = 0
    
        dirList.forEach(async (file,index) => {
            console.log(`watermark - watermarking ${file}`)
            let metadata = await sharp(path.join(inputDir,file)).metadata()
            await sharp(pathToWatermark)
                .resize({ width: Math.round(metadata.width*0.9)})
                .rotate(-45, {
                    background : { r: 255, g: 0, b: 0, alpha: 0 }
                })
                .toBuffer({resolveWithObject: true})
                .then(({data, info})=>{
                        sharp(path.join(inputDir,file))
                        .composite([
                            { input: data }
                        ])
                        .toFile(path.join(inputDir, `wm-${index}.png`), (err)=>{
                            fs.unlinkSync(path.join(inputDir,file))
                            count+=1;
                            console.log(`watermark - Done watermarking ${count} files`)
                            if(dirList.length === count){
                                resolve("AllDone")
                            }
                        })
                        
                })
        });
    })
    let data = await watermarking;
    return inputDir
} 