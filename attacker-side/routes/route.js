
const express=require('express');
const router=express.Router(); 
router.get("/sendmoney", (req, res) => {
  
  res.render("sendmoney");
});

module.exports=router;