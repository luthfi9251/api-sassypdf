const express = require('express')
const https = require('https')
const fs = require('fs')
const path = require('path')
const cors = require('cors')

require('dotenv').config()

const upload = require('./middleware/multer')
const convertToPNG = require('./tools/converter')
const watermark = require('./tools/watermark')
const toPdf = require('./tools/makepdf')
const creditCheck = require('./tools/creditCheck')

const PORT = process.env.PORT || 4000
const app = express()


app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(cors())

app.get('/info', async (req, res)=>{
    let credit = await creditCheck()
    res.json({
        credit
    })
})

app.post('/upload', upload.single('pdf'), async (req,res)=>{

    let { pathOut } = await convertToPNG(path.resolve(req.file.path), req.file.filename, './images/')
    let inputPath = await watermark(pathOut)
    let pathDown = toPdf(inputPath, req.file.filename)
    let credit = await creditCheck()
    
    res.json({
        id : path.basename(pathDown, ".pdf"),
        filename : encodeURI(req.file.originalname),
        credit
    })
})

app.get('/download/:id/:name', (req, res)=>{
    let { id, name} = req.params
    let address = path.join(__dirname, 'result', `${id}.pdf`)
    res.download(address, decodeURI(name), (err)=>{
        if(err) console.log(err)
        fs.stat(address, function(err, stat) {
            if (err == null) {
                fs.unlinkSync(address)
                console.log("File Deleted")
            } else {
                return
            }
        });
        
    })
})

app.listen(PORT, err=>{
    if (err){
        console.log(err);
    }else{
        console.log(`Server is running on port ${PORT}`)
    }
})