const express=require("express");
const app=express();
const PORT=process.env.PORT||3000;
const pool=require('./db');
app.use(express.json());

function generateRanShortCodes(){
    return Math.random().toString(36).substring(2,8);
}

app.listen(PORT,()=>{
    console.log(`Listening to PORT ${PORT}`);
});
app.get("/",(req,res)=>{
    res.send("URL Shortener API");
});
app.post("/shorten",async(req,res)=>{
    try{
        const {url}=req.body;
        if(!url.startsWith('https://')&&!url.startsWith('http://')){
            return res.status(400).json({error:"URL is required"});
        } 
        const shortCode=generateRanShortCodes();
        const result = await pool.query(
            'INSERT INTO urls(original_url, short_code) VALUES($1,$2) RETURNING *',
            [url, shortCode]
        );
        const newUrl=result.rows[0];
        res.json({
            shortUrl: `${req.protocol}://${req.get('host')}${newUrl.short_code}`,
            originalUrl: newUrl.original_url,
            shortCode: newUrl.short_code
        });
    } catch(error){
        if(error.code==='23505'){ return res.status(409).json({error:"Short code collision"}); } 
        console.error(error);
        res.status(500).json({error:"Server Error"});
    }
});

app.get('/:shortCode',async(req,res)=>{
    try{
    const {shortCode}=req.params;
    const result=await pool.query(
        'SELECT * FROM urls WHERE short_code=$1',
        [shortCode]
    );
    if(result.rows.length===0){
        return res.status(404).json({error:"404 Short URL not found"});
    }
    const urlData=result.rows[0];
    await pool.query(
        'UPDATE urls SET clicks=clicks+1 WHERE short_code=$1',
        [shortCode]
    );
    res.redirect(urlData.original_url);
} catch(error){
    console.error(error);
    res.status(500).json({error:"Service error encountered"});
}
});
app.get("/stats/:shortCode",async(req,res)=>{
    try{
    const {shortCode}=req.params;
    const result=await pool.query(
        'SELECT * FROM urls WHERE short_code=$1',
        [shortCode]
    );
    if(result.rows.length===0){
        return res.status(404).json({error:"404 Short URL does not exist"});

    }
    const urlData=result.rows[0];
    res.json({
        originalUrl: urlData.original_url,
        shortCode: urlData.short_code,
        clicks: urlData.clicks,
        createdAt: urlData.created_at
    });
} catch(error){
        console.error(error);
        res.status(500).json({error:"Server error encountered"});
    }
});