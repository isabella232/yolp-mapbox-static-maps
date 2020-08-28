// @ts-ignore
import * as polyline from '@mapbox/polyline'
import { circle } from '@turf/turf'
import 'url-search-params-polyfill'

type KeyValue = { [id: string]: string }
const fallbackPinColor = 'FF0000'

export type ConvertOutput = string
export interface ConvertOpts {
  accountId: string
  mapboxToken: string
  style: string
}

const toFloat = (val: string | number | null): [boolean, number] => {
  const float = parseFloat('' + (val ?? 'n/a'))
  if (isNaN(float)) {
    return [false, 0]
  }
  return [true, float]
}

const toInt = (val: string | number | null): [boolean, number] => {
  const float = parseInt('' + (val ?? 'n/a'), 10)
  if (isNaN(float)) {
    return [false, 0]
  }
  return [true, float]
}

export const convert = (url: string, opts: ConvertOpts): ConvertOutput => {
  if (!opts.accountId) {
    throw new TypeError('`accountId` must be specified')
  }
  if (!opts.mapboxToken) {
    throw new TypeError('`mapboxToken` must be specified')
  }
  if (!opts.style) {
    throw new TypeError('`style` must be specified')
  }

  const token = opts.mapboxToken
  const params = new URLSearchParams(url)

  const [heightok, height] = toFloat(params.get('height'))
  if (heightok !== true) {
    throw new TypeError('`height` must be a valid number')
  }

  const [widthok, width] = toFloat(params.get('width'))
  if (widthok !== true) {
    throw new TypeError('`width` must be a valid number')
  }

  const overlay = []

  const pin = convertPtoPins(params)
  if (pin) {
    overlay.push(pin)
  }

  const line = convertLtoLinePath(params)
  if (line) {
    overlay.push(line)
  }

  const polygon = convertPtoPolygon(params)
  if (polygon) {
    overlay.push(polygon)
  }

  const circle = convertEtoCircle(params)
  if (circle) {
    overlay.push(circle)
  }

  // Nullish Coalescing https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#nullish-coalescing
  const [latok, lat] = toFloat(params.get('lat'))
  const [lngok, lng] = toFloat(params.get('lon'))
  const zparam = params.get('z')

  // ※1：pin*、l、p、e、url、bboxによる指定がない場合は、lat（緯度）・lon（経度）・z（縮尺）が必須パラメータとなります。

  if (requireLatLng(overlay)) {
    if (latok !== true) {
      throw new TypeError('`lat` must be a valid number')
    }

    if (lngok !== true) {
      throw new TypeError('`lon` must be a valid number')
    }
  }

  const mode = params.get('mode')

  const [acct, onlyStyle] = modeToAcctStyle(opts.style, mode)
  if (acct) {
    opts.accountId = acct
  }
  const style = opts.accountId + '/' + onlyStyle

  const latlngz = getLatLngZoom(zparam, overlay, line, lat, lng)

  if (overlay.length > 0) {
    return `https://api.mapbox.com/styles/v1/${style}/static/${overlay.join(
      ','
    )}/${latlngz}/${width}x${height}?access_token=${token}`
  }
  return `https://api.mapbox.com/styles/v1/${style}/static/${latlngz}/${width}x${height}?access_token=${token}`
}

const requireLatLng = (overlay: string[]) => {
  return overlay.length === 0
}

// YOLP map is more zoomed in than that of Mapbox by a value of 2
// default is zoom = 15
const convertZparamToNumber = (zparam: string | null): number => {
  if (!zparam) {
    return 15
  }
  const [ok, z] = toInt(zparam)
  if (ok !== true) {
    return 15
  }
  return z - 2
}

// @ts-ignore
const getLatLngZoom = (
  zparam: string | null,
  overlay: string[],
  line?: string,
  lat?: number,
  lng?: number
) => {
  if (overlay.length === 0 && !line) {
    const zoom = convertZparamToNumber(zparam!)
    return `${lng},${lat},${zoom}`
  }
  if (!lng || !lat || !zparam) {
    return 'auto'
  }
  const zoom = convertZparamToNumber(zparam)
  return `${lng},${lat},${zoom}`
}

const convertPtoPins = (params: URLSearchParams): string => {
  const pins = findPins(params)
  const overlay = []
  for (const pin in pins) {
    if (!pins.hasOwnProperty(pin)) {
      continue
    }
    const num = pin.replace('pin', '')
    const pin1 = params.get(pin)
    if (!pin1) {
      continue
    }
    // pin*=（1）,（2）,（3）,（4） （*に指定可能な文字：0～99, a～z, default, 指定無し）
    // （1）：[float]緯度（十進度形式）
    // （2）：[float]経度（十進度形式）
    // （3）：[string]（UTF-8でURLエンコードされた）ラベル（省略可）
    // （4）：[color]色（red, blue, green, yellow, 省略可）
    // 例）pin1=35,135,test&pin2=35.156418,136.876035,test2&pin3=35.1,136.5,test,red
    const list = pin1.split(',')
    if (list.length < 2) {
      continue
    }

    // https://docs.mapbox.com/api/maps/#marker
    // Marker shape and size. Options are pin-s and pin-l.
    const name = 'pin-s'
    // Marker symbol. Options are an alphanumeric label a through z, 0 through 99, or a valid Maki icon. If a letter is requested, it will be rendered in uppercase only.
    const label = num ? num.charAt(0) : ''
    // A 3- or 6-digit hexadecimal color code.
    const color = list.length === 4 ? colorNameToHex(list[3]) : 'FF0000'
    // The location at which to center the marker. When using an asymmetric marker, make sure that the tip of the pin is at the center of the image.
    overlay.push(`${name}-${label}+${color}(${list[1]},${list[0]})`)
  }

  return overlay.join(',')
}

const findPins = (params: URLSearchParams): KeyValue => {
  const pinMap: KeyValue = {}
  const pinkey = /^pin\w+$/
  // @ts-ignore
  for (const [key, value] of params?.entries() as IterableIterator<[string, string]>) {
    if (!pinkey.test(key)) {
      continue
    }
    pinMap[key] = value
  }
  return pinMap
}

const componentToHex = (c: number) => {
  const hex = c.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

const rgbToHex = (r: string | null, g: string | null, b: string | null) => {
  let [redok, red] = toInt(r)
  if (redok !== true) {
    red = 0
  }
  let [greenok, green] = toInt(g)
  if (greenok !== true) {
    green = 0
  }
  let [blueok, blue] = toInt(b)
  if (blueok !== true) {
    blue = 0
  }
  return componentToHex(red) + componentToHex(green) + componentToHex(blue)
}

const modeToAcctStyle = (style: string, mode: string | null): [string | undefined, string] => {
  // YOLPで使用されている`mode`属性は地図の種類を示す。
  //      map - 通常の地図
  //      photo - 航空写真
  //      map-b1 - 地下街
  //      hd - ハイビジョン地図
  //      hybrid - ハイブリッド地図
  //      blankmap - 白地図
  //      osm - OpenStreetMap

  if (!mode) {
    return [undefined, style]
  }
  switch (mode) {
    case 'photo':
      return ['mapbox', 'satellite-v9']
    default:
      // returns whatever is set by the client
      return [undefined, style]
  }
}

const convertLtoLinePath = (params: URLSearchParams): string | undefined => {
  const line = params.get('l')
  if (!line) {
    return
  }
  // YOLP:
  //     地図上に複数のポイントから構成される線を描画できます。
  //   ポリラインを表示するには、lパラメータに線の色、線の透過度、線の太さ、緯度、経度を「,（コンマ）」区切りで指定します。
  //  色（レッド値：0～255）
  //  色（グリーン値：0～255）
  //  色（ブルー値：0～255）
  //  透過度（0～127）
  //  太さ（単位：pixel）
  //  頂点の緯度
  //  頂点の経度
  //  例えば、太さ2pixelの赤色の線を東京から大阪まで引く場合は以下のように指定します。
  //  l=255,0,0,1,2,35.681564010675,139.76721006431,34.701974475101,135.49513431327

  // Mapbox:
  //    path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({polyline})
  //    Encoded polylines with a precision of 5 decimal places can be used with the Static API via the path parameter.

  const lineParts = line.split(':')
  const parts = lineParts.reduce((prev: string[], part: string) => {
    const linelist = part.split(',')
    // ignore if one lat,lng is not specified
    if (linelist.length < 7) {
      return prev
    }
    const color = rgbToHex(linelist[0], linelist[1], linelist[2])
    let [swok, strokeWidth] = toInt(linelist[4])
    if (swok !== true) {
      strokeWidth = 0
    }
    const opacity = convertOpacity(linelist[3])
    const coords = linelist.slice(5).reduce((p: number[][], c: string, idx: number) => {
      const [ok, val] = toFloat(c)
      if (!ok) {
        return p
      }
      if (idx % 2 === 1) {
        // lng
        p[p.length - 1][1] = val
      } else {
        p.push([val])
      }
      return p
    }, [])
    const encodedPolyline = polyline.encode(coords)
    const path = `path-${strokeWidth}+${color}-${opacity}(${encodeURIComponent(encodedPolyline)})`
    prev.push(path)
    return prev
  }, [])
  return parts.join(',')
}

const convertPtoPolygon = (params: URLSearchParams): string | undefined => {
  const p = params.get('p')
  if (!p) {
    return
  }
  // YOLP:
  //   ポリゴンを指定します。書式は以下の通り。
  // p=（1）,（2）,（3）,（4）,（5）,（6）,（7）,（8）,（9）,（10）,（11）,（10）,（11）,（10）,（11）......
  // （1）：[integer]枠の色（レッド値：0～255）
  // （2）：[integer]枠の色（グリーン値：0～255）
  // （3）：[integer]枠の色（ブルー値：0～255）
  // （4）：[integer]枠の透過度（0～127）
  // （5）：[integer]枠の太さ（単位：pixel）
  // （6）：[integer]塗りつぶしの色（レッド値：0～255）
  // （7）：[integer]塗りつぶしの色（グリーン値：0～255）
  // （8）：[integer]塗りつぶしの色（ブルー値：0～255）
  // （9）：[integer]塗りつぶしの透過度（0～127）
  // （10）：[float]頂点の緯度（十進度形式）
  // （11）：[float]頂点の経度（十進度形式）
  // 緯度と経度のペアを3つ以上指定する必要があります。複数のポリゴンを描画する場合は、「:（コロン）」で区切ります。
  // 例）p=0,0,255,1,20,255,0,0,1,34.999,135,35,135.001,35,135.002,34.999,135.001

  // Mapbox:
  //    path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({polyline})
  //    Encoded polylines with a precision of 5 decimal places can be used with the Static API via the path parameter.

  const polygonParts = p.split(':')
  const parts = polygonParts.reduce((prev: string[], part: string) => {
    const linelist = part.split(',')
    // 緯度と経度のペアを3つ以上指定する必要があります。複数のポリゴンを描画する場合は、「:（コロン）」で区切ります。
    if (linelist.length < 15) {
      return prev
    }
    const strokeColor = rgbToHex(linelist[0], linelist[1], linelist[2])
    let [swok, strokeWidth] = toInt(linelist[4])
    if (swok !== true) {
      strokeWidth = 0
    }
    const strokeOpacity = convertOpacity(linelist[3])
    const fillColor = rgbToHex(linelist[5], linelist[6], linelist[7])
    const fillOpacity = convertOpacity(linelist[8])

    const coords = linelist.slice(9).reduce((p: number[][], c: string, idx: number) => {
      const [ok, val] = toFloat(c)
      if (ok !== true) {
        return p
      }
      if (idx % 2 === 1) {
        // lng
        p[p.length - 1][1] = val
      } else {
        p.push([val])
      }
      return p
    }, [])
    const encodedPolyline = polyline.encode(coords)
    const path = `path-${strokeWidth}+${strokeColor}-${strokeOpacity}+${fillColor}-${fillOpacity}(${encodeURIComponent(
      encodedPolyline
    )})`
    prev.push(path)
    return prev
  }, [])
  return parts.join(',')
}

const convertEtoCircle = (params: URLSearchParams): string | undefined => {
  const e = params.get('e')
  if (!e) {
    return
  }
  // YOLP:
  //   円を指定します。書式は以下の通り。
  // e=（1）,（2）,（3）,（4）,（5）,（6）,（7）,（8）,（9）,（10）,（11）,（12）
  // （1）：[integer]枠の色（レッド値：0～255）
  // （2）：[integer]枠の色（グリーン値：0～255）
  // （3）：[integer]枠の色（ブルー値：0～255）
  // （4）：[integer]枠の透過度（0～127）
  // （5）：[integer]枠の太さ（単位：pixel）
  // （6）：[integer]塗りつぶしの色（レッド値：0～255）
  // （7）：[integer]塗りつぶしの色（グリーン値：0～255）
  // （8）：[integer]塗りつぶしの色（ブルー値：0～255）
  // （9）：[integer]塗りつぶしの透過度（0～127）
  // （10）：[float]中心の緯度（十進度形式）
  // （11）：[float]中心の経度（十進度形式）
  // （12）：[integer]円の半径（単位：m）
  // 複数の円を描画する場合は、「:（コロン）」で区切ります。
  // 例）e=255,0,255,1,3,255,0,0,100,35,135,10

  // Mapbox:
  //    path-{strokeWidth}+{strokeColor}-{strokeOpacity}+{fillColor}-{fillOpacity}({polyline})
  //    Encoded polylines with a precision of 5 decimal places can be used with the Static API via the path parameter.

  const polygonParts = e.split(':')
  const parts = polygonParts.reduce((prev: string[], part: string) => {
    const linelist = part.split(',')
    // 緯度と経度のペアを3つ以上指定する必要があります。複数のポリゴンを描画する場合は、「:（コロン）」で区切ります。
    if (linelist.length < 12) {
      return prev
    }

    const strokeColor = rgbToHex(linelist[0], linelist[1], linelist[2])
    let [swok, strokeWidth] = toInt(linelist[4])
    if (swok !== true) {
      strokeWidth = 0
    }
    const strokeOpacity = convertOpacity(linelist[3])
    const fillColor = rgbToHex(linelist[5], linelist[6], linelist[7])
    const fillOpacity = convertOpacity(linelist[8])

    const [latok, lat] = toFloat(linelist[9])
    if (latok !== true) {
      return prev
    }
    const [lngok, lng] = toFloat(linelist[10])
    if (lngok !== true) {
      return prev
    }

    let [radiusok, radius] = toInt(linelist[11])
    if (radiusok !== true) {
      return prev
    }

    const center = [lng, lat]
    const options = { steps: 40, units: 'meters' }
    // @ts-ignore
    const circlePolygon = circle(center, radius, options)
    if ((circlePolygon.geometry?.coordinates ?? []).length === 0) {
      // TODO how to track this error
      return prev
    }
    const fmted = circlePolygon.geometry?.coordinates[0].map(val => {
      return [val[1], val[0]]
    })
    const encodedPolyline = polyline.encode(fmted)
    const path = `path-${strokeWidth}+${strokeColor}-${strokeOpacity}+${fillColor}-${fillOpacity}(${encodeURIComponent(
      encodedPolyline
    )})`
    prev.push(path)
    return prev
  }, [])
  return parts.join(',')
}

// 127 -> 0
// 0 -> 1
const convertOpacity = (val: string) => {
  let [ok, fillOpacity] = toInt(val)
  if (ok !== true) {
    fillOpacity = 0
  }
  let fmtFillOpacity = Math.min(1, Math.max(1 - fillOpacity / 127, 0))
  // fixing to 2 dec places to avoid URL length limit
  return Math.round(fmtFillOpacity * 100) / 100
}

const colorNameToHex = (color: string): string => {
  const colors: { [id: string]: string | undefined } = {
    aliceblue: 'f0f8ff',
    antiquewhite: 'faebd7',
    aqua: '00ffff',
    aquamarine: '7fffd4',
    azure: 'f0ffff',
    beige: 'f5f5dc',
    bisque: 'ffe4c4',
    black: '000000',
    blanchedalmond: 'ffebcd',
    blue: '0000ff',
    blueviolet: '8a2be2',
    brown: 'a52a2a',
    burlywood: 'deb887',
    cadetblue: '5f9ea0',
    chartreuse: '7fff00',
    chocolate: 'd2691e',
    coral: 'ff7f50',
    cornflowerblue: '6495ed',
    cornsilk: 'fff8dc',
    crimson: 'dc143c',
    cyan: '00ffff',
    darkblue: '00008b',
    darkcyan: '008b8b',
    darkgoldenrod: 'b8860b',
    darkgray: 'a9a9a9',
    darkgreen: '006400',
    darkkhaki: 'bdb76b',
    darkmagenta: '8b008b',
    darkolivegreen: '556b2f',
    darkorange: 'ff8c00',
    darkorchid: '9932cc',
    darkred: '8b0000',
    darksalmon: 'e9967a',
    darkseagreen: '8fbc8f',
    darkslateblue: '483d8b',
    darkslategray: '2f4f4f',
    darkturquoise: '00ced1',
    darkviolet: '9400d3',
    deeppink: 'ff1493',
    deepskyblue: '00bfff',
    dimgray: '696969',
    dodgerblue: '1e90ff',
    firebrick: 'b22222',
    floralwhite: 'fffaf0',
    forestgreen: '228b22',
    fuchsia: 'ff00ff',
    gainsboro: 'dcdcdc',
    ghostwhite: 'f8f8ff',
    gold: 'ffd700',
    goldenrod: 'daa520',
    gray: '808080',
    green: '008000',
    greenyellow: 'adff2f',
    honeydew: 'f0fff0',
    hotpink: 'ff69b4',
    'indianred ': 'cd5c5c',
    indigo: '4b0082',
    ivory: 'fffff0',
    khaki: 'f0e68c',
    lavender: 'e6e6fa',
    lavenderblush: 'fff0f5',
    lawngreen: '7cfc00',
    lemonchiffon: 'fffacd',
    lightblue: 'add8e6',
    lightcoral: 'f08080',
    lightcyan: 'e0ffff',
    lightgoldenrodyellow: 'fafad2',
    lightgrey: 'd3d3d3',
    lightgreen: '90ee90',
    lightpink: 'ffb6c1',
    lightsalmon: 'ffa07a',
    lightseagreen: '20b2aa',
    lightskyblue: '87cefa',
    lightslategray: '778899',
    lightsteelblue: 'b0c4de',
    lightyellow: 'ffffe0',
    lime: '00ff00',
    limegreen: '32cd32',
    linen: 'faf0e6',
    magenta: 'ff00ff',
    maroon: '800000',
    mediumaquamarine: '66cdaa',
    mediumblue: '0000cd',
    mediumorchid: 'ba55d3',
    mediumpurple: '9370d8',
    mediumseagreen: '3cb371',
    mediumslateblue: '7b68ee',
    mediumspringgreen: '00fa9a',
    mediumturquoise: '48d1cc',
    mediumvioletred: 'c71585',
    midnightblue: '191970',
    mintcream: 'f5fffa',
    mistyrose: 'ffe4e1',
    moccasin: 'ffe4b5',
    navajowhite: 'ffdead',
    navy: '000080',
    oldlace: 'fdf5e6',
    olive: '808000',
    olivedrab: '6b8e23',
    orange: 'ffa500',
    orangered: 'ff4500',
    orchid: 'da70d6',
    palegoldenrod: 'eee8aa',
    palegreen: '98fb98',
    paleturquoise: 'afeeee',
    palevioletred: 'd87093',
    papayawhip: 'ffefd5',
    peachpuff: 'ffdab9',
    peru: 'cd853f',
    pink: 'ffc0cb',
    plum: 'dda0dd',
    powderblue: 'b0e0e6',
    purple: '800080',
    rebeccapurple: '663399',
    red: 'ff0000',
    rosybrown: 'bc8f8f',
    royalblue: '4169e1',
    saddlebrown: '8b4513',
    salmon: 'fa8072',
    sandybrown: 'f4a460',
    seagreen: '2e8b57',
    seashell: 'fff5ee',
    sienna: 'a0522d',
    silver: 'c0c0c0',
    skyblue: '87ceeb',
    slateblue: '6a5acd',
    slategray: '708090',
    snow: 'fffafa',
    springgreen: '00ff7f',
    steelblue: '4682b4',
    tan: 'd2b48c',
    teal: '008080',
    thistle: 'd8bfd8',
    tomato: 'ff6347',
    turquoise: '40e0d0',
    violet: 'ee82ee',
    wheat: 'f5deb3',
    white: 'ffffff',
    whitesmoke: 'f5f5f5',
    yellow: 'ffff00',
    yellowgreen: '9acd32'
  }

  return (colors[color.toLowerCase()] ?? fallbackPinColor).toUpperCase()
}
