# POLATLAR2025 MSSQL Veri Cekme Betigi
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$server = if ($env:DB_SERVER) { $env:DB_SERVER } else { "localhost" }
$database = if ($env:DB_NAME) { $env:DB_NAME } else { "POLATLAR2025" }

$connStr = "Server=$server;Database=$database;Integrated Security=True;TrustServerCertificate=True"

try {
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()

    $query = @"
    WITH VC(ID) AS (
        SELECT VARSAYILANCARI AS ID FROM FIRMASABITLERI
    ),
    FD_GENEL(KART, ALACAK, BORC) AS (
        SELECT FD.KART_ALACAKLI AS KART, 
               FD.TUTAR AS ALACAK, CONVERT(DECIMAL(18, 2), 0) AS BORC
        FROM FINANS_DETAY AS FD 
        INNER JOIN VC ON FD.KART_ALACAKLI <> VC.ID
        WHERE FD.KART_ALACAKLI > 0
        UNION ALL
        SELECT FD.KART_BORCLU AS KART, 
               CONVERT(DECIMAL(18, 2), 0) AS ALACAK, FD.TUTAR AS BORC
        FROM FINANS_DETAY AS FD 
        INNER JOIN VC ON FD.KART_BORCLU <> VC.ID
        WHERE FD.KART_BORCLU > 0
    ),
    CARI_FINANS AS (
        SELECT 
            KART,
            SUM(BORC) AS BORC,
            SUM(ALACAK) AS ALACAK,
            SUM(BORC - ALACAK) AS BAKIYE
        FROM FD_GENEL
        GROUP BY KART
    )
    SELECT 
        C.ID,
        C.KOD,
        C.AD,
        ISNULL(CA.ADRES, '') AS ADRES,
        ISNULL(IL.AD, '') AS IL,
        ISNULL(ILCE.AD, '') AS ILCE,
        ISNULL(CA.TELEFON, ISNULL(CA.TELEFON_CEP, '')) AS TELEFON,
        ISNULL(CA.YETKILI, '') AS YETKILI,
        ISNULL(CA.ENLEM, '') AS ENLEM,
        ISNULL(CA.BOYLAM, '') AS BOYLAM,
        ISNULL(CF.BORC, 0) AS BORC,
        ISNULL(CF.ALACAK, 0) AS ALACAK,
        ISNULL(CF.BAKIYE, 0) AS BAKIYE
    FROM CARI C
    LEFT JOIN CARI_ADRES CA ON C.ID = CA.CARI AND CA.VARSAYILAN = 1
    LEFT JOIN ILILCE ILCE ON CA.ILILCE = ILCE.ID
    LEFT JOIN ILILCE IL ON ILCE.USTID = IL.ID
    LEFT JOIN CARI_FINANS CF ON C.ID = CF.KART
    WHERE C.AKTIF = 1
    ORDER BY C.AD
"@

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $query
    $cmd.CommandTimeout = 120

    $da = New-Object System.Data.SqlClient.SqlDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    $null = $da.Fill($dt)

    $rows = @()
    foreach ($r in $dt.Rows) {
        $rows += [PSCustomObject]@{
            id = [int64]$r["ID"]
            kod = [string]$r["KOD"]
            ad = [string]$r["AD"]
            adres = [string]$r["ADRES"]
            il = [string]$r["IL"]
            ilce = [string]$r["ILCE"]
            telefon = [string]$r["TELEFON"]
            yetkili = [string]$r["YETKILI"]
            enlem = [string]$r["ENLEM"]
            boylam = [string]$r["BOYLAM"]
            borc = [double]$r["BORC"]
            alacak = [double]$r["ALACAK"]
            bakiye = [double]$r["BAKIYE"]
        }
    }

    $conn.Close()
    $json = $rows | ConvertTo-Json -Depth 3 -Compress
    [System.IO.File]::WriteAllText("$PSScriptRoot\raw_cariler.json", $json, [System.Text.Encoding]::UTF8)
    Write-Output "SUCCESS: $($rows.Count) cari aktarildi."
} catch {
    Write-Error "SQL Hatasi: $_"
    exit 1
}
