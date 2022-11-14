const PDFDocument = require('pdfkit');
const fs = require('fs')
const path = require('path')

module.exports = (inputDir, name)=>{
    const doc = new PDFDocument({size: 'A4', autoFirstPage: false});
    const dir = path.resolve(inputDir)
    const outputPath = path.resolve('./result')
    const filePath = path.join(outputPath, `${name.split(".")[0]}.pdf`)

    console.log("ToPDF - Making to PDF again......")                    // Console log Status

    doc.pipe(fs.createWriteStream(filePath))

    fs.readdirSync(dir).forEach(file => {
        doc.addPage();
        doc.image(path.join(dir,file), 0, 0, {fit: [doc.page.width, doc.page.height], align: 'center', valign: 'center'})
    });

    doc.end();
    fs.rm(dir, { recursive: true, force: true },err=>{
        if(err) console.log(err)
        console.log("ToPDF - Directory deleted!")
    })
    console.log("ToPDF - Operation Success!")                       // Console log Status
    return filePath
}