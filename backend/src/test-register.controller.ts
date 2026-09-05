import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";

@Controller("test-register")
export class TestRegisterController {
  @Get()
  page(@Res() res: Response) {
    res.type("html").send(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>PassCard - تسجيل</title>
<style>
body{font-family:Arial,sans-serif;background:#f4f6f8;margin:0;padding:40px}
.card{max-width:520px;margin:auto;background:#fff;padding:30px;border-radius:18px;box-shadow:0 8px 30px #0001}
h1{margin-top:0}
input{width:100%;box-sizing:border-box;padding:12px;margin:7px 0 14px;border:1px solid #ddd;border-radius:10px;font-size:16px}
button{width:100%;padding:13px;border:0;border-radius:10px;background:#111;color:#fff;font-size:17px;cursor:pointer}
#result{white-space:pre-wrap;margin-top:18px;padding:14px;border-radius:10px;background:#f1f3f5}
label{font-weight:bold}
</style>
</head>
<body>
<div class="card">
<h1>إنشاء حساب PassCard</h1>
<form id="form">
<label>الاسم</label>
<input name="name" required>

<label>البريد الإلكتروني</label>
<input name="email" type="email" required>

<label>رقم الجوال</label>
<input name="phone" required>

<label>تاريخ الميلاد</label>
<input name="dateOfBirth" type="date" required>

<label>كلمة المرور</label>
<input name="password" type="password" minlength="8" required>

<button type="submit">إنشاء الحساب</button>
</form>
<div id="result"></div>
</div>

<script>
const form=document.getElementById("form");
const result=document.getElementById("result");

form.addEventListener("submit",async(e)=>{
  e.preventDefault();
  result.textContent="جاري إنشاء الحساب...";

  const data=Object.fromEntries(new FormData(form).entries());

  try{
    const response=await fetch("/api/v1/auth/register",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });

    const body=await response.json();
    result.textContent=JSON.stringify(body,null,2);
  }catch(error){
    result.textContent="فشل الاتصال بالـBackend: "+error.message;
  }
});
</script>
</body>
</html>`);
  }
}
