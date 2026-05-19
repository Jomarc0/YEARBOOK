<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body   { font-family: DejaVu Serif, serif; margin:60px; background:#fffdf5; color:#1a1a2e; }
  .border{ border:6px double #b8962e; padding:40px; text-align:center; min-height:480px; }
  .title { font-size:36px; color:#b8962e; letter-spacing:4px; margin-bottom:10px; }
  .sub   { font-size:14px; color:#666; letter-spacing:2px; margin-bottom:40px; }
  .name  { font-size:32px; font-weight:bold; border-bottom:1px solid #b8962e; display:inline-block; padding:0 40px 8px; margin:20px 0; }
  .body  { font-size:15px; line-height:2; color:#444; max-width:500px; margin:0 auto; }
  .date  { margin-top:40px; font-size:13px; color:#666; }
</style>
</head>
<body>
  <div class="border">
    <div class="title">CERTIFICATE</div>
    <div class="sub">OF GRADUATION</div>
    <div class="body">This is to certify that</div>
    <div class="name">{{ $user->name }}</div>
    <div class="body">
      has successfully completed the requirements for graduation<br>
      from <strong>National University Lipa</strong><br>
      and is hereby awarded this digital yearbook recognition.
    </div>
    <div class="date">Awarded on {{ $date }}</div>
  </div>
</body>
</html>