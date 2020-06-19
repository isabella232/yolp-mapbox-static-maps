
## yolp-mapbox-static-maps

YOLPスタティックイメージからMapbox Static Imagesへの移行JSライブラリ

[実装デモ](https://hey.mapbox.com/labs-sandbox-demos/yolp-proxy/)をご参照ください。

## インストール

```
yarn add yolp-mapbox-static-maps
# 又は 
npm run yolp-mapbox-static-maps
```

## 実装

JSに導入する場合の実装。

```
import {convert} from 'yolp-mapbox-static-maps'

const yjApiUrl = 'https://map.yahooapis.jp/map/V1/static?appid=/<アプリケーションID>/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600'
const opts = {
    accountId: 'マップボックスID',
    mapboxToken: 'Mapboxトークン',
    style: 'Mapboxで作成した地図のスタイル',
}
const mapboxUrl = convert(yjApiUrl, opts)
console.log(mapboxUrl)
// https://api.mapbox.com/styles/v1/<マップボックスID>/<Mapboxで作成した地図のスタイル>/static/139.74553000746,35.658619279712,13/600x600?access_token=<Mapboxトークン>
```

又はHTMLに直接埋め込めれます。

```
<head>
  <script src="https://cdn.." integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>
</head>

<body>
    <!-- 既存実装方法 -->
    <img src='yolpUrl' />

    <!-- Mapboxへ移行 -->
    <img src='convert(yolpUrl)' />
</body>
```

## 移行による比較

| 事例 |  YOLP | Mapbox |
----|----|---- 
| | | 
| 地図を表示する |  ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&) | ![alt](https://api.mapbox.com/styles/v1/takutosuzukimapbox/ckbkcwljf0mvt1imr144bf98w/static/139.74553000746,35.658619279712,13/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA) |
| 衛星写真を表示する |  ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&mode=photo) | ![alt](https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/139.74553000746,35.658619279712,13/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA) |
|ピンを立てる | ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&pin1=35.658619279712,139.74553000746,Tower&z=17&width=600&height=600) | ![alt](https://api.mapbox.com/styles/v1/takutosuzukimapbox/ckbkcwljf0mvt1imr144bf98w/static/pin-s-1+FF0000(139.74553000746,35.658619279712)/139.74553000746,35.658619279712,15/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA)
| 線を描く |  ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&width=600&height=600&l=255,0,0,1,2,35.681564010675,139.76721006431,34.701974475101,135.49513431327) | ![alt](https://api.mapbox.com/styles/v1/takutosuzukimapbox/ckbkcwljf0mvt1imr144bf98w/static/path-2+ff0000-0.99(w%60xxEahatYli~DnkaY)/auto/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA) |
| 円を描く |  ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&width=600&height=600&e=0,255,0,0,5,0,255,0,127,35.681564010675,139.76721006431,50000:255,0,0,0,5,255,0,0,127,35.991564010675,139.96721006431,10000&pointer=on) | ![alt](https://api.mapbox.com/styles/v1/takutosuzukimapbox/ckbkcwljf0mvt1imr144bf98w/static/path-5+00ff00-1+00ff00-0(c%7Bo%7BEahatYva%40h_PpfBrqOrhDvvNnfFhoMt~Gh%7CKpoIb_J%60xJfyGhwKplEjlL%60%7BBxvLpf%40lvLsl%40fkLm%60CpuK%7BpEzuJa%7CGbmIa%60Jd%7CGk%7BKjdFolMzfDmrNjeBglOla%40gyOma%40gyOkeBglO%7BfDmrNkdFolMe%7CGk%7BKcmIa%60J%7BuJa%7CGquK%7BpEgkLm%60CmvLsl%40yvLpf%40klL%60%7BBiwKplEaxJfyGqoIb_Ju~Gh%7CKofFhoMshDvvNqfBrqOwa%40h_P),path-5+ff0000-1+ff0000-0(kdf%7BEajhuY%7CExkBrS%60iBx%60%40xcBbm%40~%7BAhx%40%7CqAbbAveAfjA%7Cw%40npArh%40xtAhX%7CvAlGzvAuGvtAqXlpAyh%40djA_x%40~aAyeAfx%40%7BqA%60m%40%7B%7BAt%60%40scBpS%7BhB%7CEqkB%7DEqkBqS%7BhBu%60%40scBam%40%7B%7BAgx%40%7BqA_bAyeAejA_x%40mpAyh%40wtAqX%7BvAuG%7DvAlGytAhXopArh%40gjA%7Cw%40cbAveAix%40%7CqAcm%40~%7BAy%60%40xcBsS%60iB%7DExkB)/auto/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA) |
| ポリゴンを描く |  ![alt](https://map.yahooapis.jp/map/V1/static?appid=dj00aiZpPXBsS1dycEZQczV4TyZzPWNvbnN1bWVyc2VjcmV0Jng9NTc-&width=600&height=600&p=0,0,255,0,3,0,0,255,60,35.667099078055365,139.73058972764818,35.66578290519938,139.72930226732103,35.6644579940522,139.7310617964348,35.66597466683339,139.73281059671243) | ![alt](https://api.mapbox.com/styles/v1/takutosuzukimapbox/ckbkcwljf0mvt1imr144bf98w/static/path-3+0000ff-1+0000ff-0.53(kfuxEeczsYfG%60GfG_JmH%7DI)/auto/600x600?access_token=pk.eyJ1IjoidGFrdXRvc3V6dWtpbWFwYm94IiwiYSI6ImNrMjJlMXplcTE4a2czY3F3MWkxZHN4cWkifQ.CRcFM34KAOiPKIbscodOqA) |
|  |  |

