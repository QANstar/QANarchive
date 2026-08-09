# QAN Gallery API end-to-end smoke test (ASCII only)
$ErrorActionPreference = "Stop"
$base = "http://localhost:5000"

function Show($title, $obj) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
    $obj | ConvertTo-Json -Depth 8
}

# 1. login
$login = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType "application/json" -Body '{"account":"test02","password":"123456"}'
$token = $login.token
Show "Login" $login.user

$headers = @{ Authorization = "Bearer $token" }

# 2. create character
$charBody = @{ name = "Hoshino Ai"; prompt = "silver hair, idol, red eyes"; intro = "test character"; tags = @("idol", "silver-hair") } | ConvertTo-Json
$char = Invoke-RestMethod -Method Post -Uri "$base/api/characters" -ContentType "application/json" -Headers $headers -Body $charBody
Show "Create Character" $char
$charId = $char.id

# 3. create part
$partBody = @{ category = "Hairstyle"; name = "Twin Tails"; prompt = "twin tails, long hair"; intro = "classic twintails"; tags = @("hair") } | ConvertTo-Json
$part = Invoke-RestMethod -Method Post -Uri "$base/api/parts" -ContentType "application/json" -Headers $headers -Body $partBody
Show "Create Part" $part
$partId = $part.id

# 4. create work (linked to character + part)
$workBody = @{
    title = "Silver Idol"; prompt = "1girl, silver hair, idol, twin tails"; intro = "favorite work #1";
    workflowJson = '{"nodes":[{"id":1,"type":"KSampler"}]}';
    tags = @("idol", "silver-hair"); characterIds = @($charId); partIds = @($partId)
} | ConvertTo-Json
$work = Invoke-RestMethod -Method Post -Uri "$base/api/works" -ContentType "application/json" -Headers $headers -Body $workBody
Show "Create Work" $work
$workId = $work.id

# 5. direct-upload work (no character)
$directBody = @{ title = "Direct Upload"; prompt = "landscape, sunset"; intro = "no character"; tags = @("scenery") } | ConvertTo-Json
$direct = Invoke-RestMethod -Method Post -Uri "$base/api/works" -ContentType "application/json" -Headers $headers -Body $directBody
Show "Create Direct Work" $direct
$directId = $direct.id

# 6. gallery works tab
$gallery = Invoke-RestMethod -Method Get -Uri "$base/api/gallery?tab=works"
Show "Gallery Works" @{ total = $gallery.total; titles = @($gallery.items | ForEach-Object { $_.title }) }

# 7. gallery tag filter (AND: idol + silver-hair)
$tagQuery = [uri]::EscapeDataString("idol,silver-hair")
$filtered = Invoke-RestMethod -Method Get -Uri "$base/api/gallery?tab=works&tags=$tagQuery"
Show "Gallery TagFilter" @{ total = $filtered.total; titles = @($filtered.items | ForEach-Object { $_.title }) }

# 8. gallery search
$searchQuery = [uri]::EscapeDataString("Direct")
$searched = Invoke-RestMethod -Method Get -Uri "$base/api/gallery?tab=works&search=$searchQuery"
Show "Gallery Search" @{ total = $searched.total; titles = @($searched.items | ForEach-Object { $_.title }) }

# 9. hot tags
$hot = Invoke-RestMethod -Method Get -Uri "$base/api/tags/hot"
Show "Hot Tags" @($hot | ForEach-Object { "$($_.name):$($_.usageCount)" })

# 10. character detail (collection)
$charDetail = Invoke-RestMethod -Method Get -Uri "$base/api/characters/$charId"
Show "Character Detail" @{ name = $charDetail.name; workCount = $charDetail.works.Count; workTitles = @($charDetail.works | ForEach-Object { $_.title }) }

# 11. work detail (links)
$workDetail = Invoke-RestMethod -Method Get -Uri "$base/api/works/$workId"
Show "Work Detail" @{ title = $workDetail.title; characters = @($workDetail.characters | ForEach-Object { $_.name }); parts = @($workDetail.parts | ForEach-Object { $_.name }); hasWorkflow = ($null -ne $workDetail.workflowJson) }

# 12. add existing work to character collection
$addBody = @{ workIds = @($directId) } | ConvertTo-Json
$add = Invoke-RestMethod -Method Post -Uri "$base/api/characters/$charId/works" -ContentType "application/json" -Headers $headers -Body $addBody
Show "Add Work To Collection" $add
$charDetail2 = Invoke-RestMethod -Method Get -Uri "$base/api/characters/$charId"
Show "Collection Count After Add" @{ workCount = $charDetail2.works.Count }

# 13. unauthenticated write should be 401
try {
    Invoke-RestMethod -Method Post -Uri "$base/api/works" -ContentType "application/json" -Body '{"title":"x","prompt":"x"}'
    Write-Host "`n=== Unauthorized write: FAIL (expected 401) ===" -ForegroundColor Red
} catch {
    Write-Host "`n=== Unauthorized write returned $($_.Exception.Response.StatusCode.value__) ===" -ForegroundColor Green
}

# 14. wrong invite code should be 400
try {
    Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType "application/json" -Body '{"account":"bad01","userName":"x","password":"123456","inviteCode":"WRONG"}'
    Write-Host "`n=== Wrong invite code: FAIL (expected 400) ===" -ForegroundColor Red
} catch {
    Write-Host "`n=== Wrong invite code returned $($_.Exception.Response.StatusCode.value__) ===" -ForegroundColor Green
}

# 15. edit work (replace tags/links)
$editBody = @{ title = "Silver Idol v2"; prompt = "1girl, silver hair, idol"; intro = "updated"; tags = @("idol"); characterIds = @($charId); partIds = @() } | ConvertTo-Json
$edited = Invoke-RestMethod -Method Put -Uri "$base/api/works/$workId" -ContentType "application/json" -Headers $headers -Body $editBody
Show "Edit Work" $edited
$workDetail2 = Invoke-RestMethod -Method Get -Uri "$base/api/works/$workId"
Show "Work After Edit" @{ title = $workDetail2.title; parts = @($workDetail2.parts | ForEach-Object { $_.name }); tags = @($workDetail2.tags) }

# 16. delete direct work
$deleted = Invoke-RestMethod -Method Delete -Uri "$base/api/works/$directId" -Headers $headers
Show "Delete Direct Work" $deleted

Write-Host "`nALL TESTS DONE" -ForegroundColor Green
