import {
  convert, ConvertOpts,
} from "../src/yolp-mapbox-static-maps"

const mapboxToken = 'pk.mapbox-token'
const mapboxStyle = 'mapbox-streets-v8'
const mapboxAcct = 'mapbox'
const yolpAppId = 'yolp-token'

interface TestTable {
  input: string
  expected: {
    errors?: string[],
    thrownErr?: Error,
    url?: string,
  }
}

const defaultOpts = () => {
  return {
    accountId: mapboxAcct,
    mapboxToken,
    style: mapboxStyle,
  }
}

describe("Mapping YOLP static API params to Mapbox Static Maps", () => {

  test('minimum required opts', () => {
    const urlInput = `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600`
    const required = {
      accountId: mapboxAcct,
      mapboxToken,
      style: mapboxStyle,
    }
    const failParams: { opts: ConvertOpts, key: string }[] = Object.keys(required).map((key) => {
      const newobj = {
        ...required,
        [key]: undefined,
      }
      return {
        key,
        opts: newobj,
      }
    })
    failParams.forEach((param) => {
      const t = () => {
        convert(urlInput, param.opts)
      }
      expect(t).toThrowError('`' + param.key + '` must be specified')
    })
  })

  test('minimum required URL params', () => {
    const testTable: TestTable[] = [{
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lon=139.74553000746&z=15&width=600&height=600`,
      expected: {
        thrownErr: new TypeError('`lat` must be valid number')
      },
    }, {
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&z=15&width=600&height=600`,
      expected: {
        thrownErr: new Error('`lon` must be a valid number')
      },
    }, {
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600`,
      expected: {
        thrownErr: new Error('`height` must be a valid number')
      },
    }, {
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&height=600`,
      expected: {
        thrownErr: new Error('`width` must be a valid number')
      },
    }]

    testTable.forEach((table: TestTable) => {
      const t = () => {
        convert(table.input, defaultOpts())
      }
      expect(t).toThrowError(TypeError)
    })
  })

  test("should convert URL if valid", () => {
    const testTable = [{
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    },]

    testTable.forEach((t: TestTable) => {
      const url = convert(t.input, defaultOpts())
      expect(url).toBe(t.expected.url)
    })
  })

  test("should map mode to style", () => {
    const testTable = [{
      // mode=map
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&mode=map`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // mode=photo
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&mode=photo`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }]

    testTable.forEach((t: TestTable) => {
      const url = convert(t.input, defaultOpts())
      expect(url).toBe(t.expected.url)
    })
  })

  test('should map pins', () => {
    const testTable: TestTable[] = [{
      // should show one pin
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&pin1=35.658619279712,139.74553000746,test`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/pin-s-1+FF0000(139.74553000746,35.658619279712)/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // should show multiple pins
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&pin1=35.658619279712,139.74553000746,Tower&pin2=35.659619279712,139.74853000746,test2&pin3=35.653619279712,139.74053000746,test,blue`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/pin-s-1+FF0000(139.74553000746,35.658619279712),pin-s-2+FF0000(139.74853000746,35.659619279712),pin-s-3+0000FF(139.74053000746,35.653619279712)/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // should show multiple pins with alphabet pin value
      input: 'https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&pinabcd=35.658619279712,139.74553000746,Tower',
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/pin-s-a+FF0000(139.74553000746,35.658619279712)/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }]

    testTable.forEach((table: TestTable) => {
      const url = convert(table.input, defaultOpts())
      expect(url).toBe(table.expected.url!)
    })
  })

  test('should map lines', () => {
    const testTable: TestTable[] = [{
      // should show one line
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&z=15&width=600&height=600&l=255,0,0,0,2,35.681564010675,139.76721006431,34.701974475101,135.49513431327`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-2+ff0000-1(w%60xxEahatYli~DnkaY)/139.74553000746,35.658619279712,13/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // should set auto if line is set but lat,lng,z are not set
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&width=600&height=600&l=255,0,0,0,2,35.681564010675,139.76721006431,34.701974475101,135.49513431327`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-2+ff0000-1(w%60xxEahatYli~DnkaY)/auto/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // should set override with auto if line is set lat,lng are set but z is not set
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&width=600&height=600&l=255,0,0,100,2,35.681564010675,139.76721006431,34.701974475101,135.49513431327&lat=35.658619279712&lon=139.74553000746`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-2+ff0000-0.21(w%60xxEahatYli~DnkaY)/auto/600x600?access_token=${mapboxToken}`,
      },
    }, {
      // should draw multiple lines
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&width=600&height=600&l=255,0,0,0,2,35,135,35.001,135.001:0,0,255,1,2,34.999,135.0,34.998,135.001&lat=35.658619279712&lon=139.74553000746`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-2+ff0000-1(_%7DrtE_e~vXgEgE),path-2+0000ff-0.99(wvrtE_e~vXfEgE)/auto/600x600?access_token=${mapboxToken}`,
      },
    },]

    testTable.forEach((table: TestTable) => {
      const url = convert(table.input, defaultOpts())
      expect(url).toBe(table.expected.url!)
    })
  })

  test('should map polygons', () => {
    const testTable: TestTable[] = [{
      // should show one polygon
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&lat=35.658619279712&lon=139.74553000746&width=600&height=600&p=0,0,255,1,20,255,0,0,1,34.999,135,35,135.001,35,135.002,34.999,135.001`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-20+0000ff-0.99+ff0000-0.99(wvrtE_e~vXgEgE%3FgEfEfE)/auto/600x600?access_token=${mapboxToken}`,
      },
    },]

    testTable.forEach((table: TestTable) => {
      const url = convert(table.input, defaultOpts())
      expect(url).toBe(table.expected.url!)
    })
  })

  test('should map circle', () => {
    const testTable: TestTable[] = [{
      // should draw a circle
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&width=600&height=600&e=0,255,0,0,5,0,255,0,127,35.681564010675,139.76721006431,50000`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-5+00ff00-1+00ff00-0(c%7Bo%7BEahatYva%40h_PpfBrqOrhDvvNnfFhoMt~Gh%7CKpoIb_J%60xJfyGhwKplEjlL%60%7BBxvLpf%40lvLsl%40fkLm%60CpuK%7BpEzuJa%7CGbmIa%60Jd%7CGk%7BKjdFolMzfDmrNjeBglOla%40gyOma%40gyOkeBglO%7BfDmrNkdFolMe%7CGk%7BKcmIa%60J%7BuJa%7CGquK%7BpEgkLm%60CmvLsl%40yvLpf%40klL%60%7BBiwKplEaxJfyGqoIb_Ju~Gh%7CKofFhoMshDvvNqfBrqOwa%40h_P)/auto/600x600?access_token=${mapboxToken}`,
      }
    }, {
      // should draw muliple circles
      input: `https://map.yahooapis.jp/map/V1/static?appid=/${yolpAppId}/&width=600&height=600&e=0,255,0,0,5,0,255,0,127,35.681564010675,139.76721006431,50000:255,0,0,0,5,255,0,0,127,35.991564010675,139.96721006431,10000`,
      expected: {
        url: `https://api.mapbox.com/styles/v1/${mapboxAcct}/${mapboxStyle}/static/path-5+00ff00-1+00ff00-0(c%7Bo%7BEahatYva%40h_PpfBrqOrhDvvNnfFhoMt~Gh%7CKpoIb_J%60xJfyGhwKplEjlL%60%7BBxvLpf%40lvLsl%40fkLm%60CpuK%7BpEzuJa%7CGbmIa%60Jd%7CGk%7BKjdFolMzfDmrNjeBglOla%40gyOma%40gyOkeBglO%7BfDmrNkdFolMe%7CGk%7BKcmIa%60J%7BuJa%7CGquK%7BpEgkLm%60CmvLsl%40yvLpf%40klL%60%7BBiwKplEaxJfyGqoIb_Ju~Gh%7CKofFhoMshDvvNqfBrqOwa%40h_P),path-5+ff0000-1+ff0000-0(kdf%7BEajhuY%7CExkBrS%60iBx%60%40xcBbm%40~%7BAhx%40%7CqAbbAveAfjA%7Cw%40npArh%40xtAhX%7CvAlGzvAuGvtAqXlpAyh%40djA_x%40~aAyeAfx%40%7BqA%60m%40%7B%7BAt%60%40scBpS%7BhB%7CEqkB%7DEqkBqS%7BhBu%60%40scBam%40%7B%7BAgx%40%7BqA_bAyeAejA_x%40mpAyh%40wtAqX%7BvAuG%7DvAlGytAhXopArh%40gjA%7Cw%40cbAveAix%40%7CqAcm%40~%7BAy%60%40xcBsS%60iB%7DExkB)/auto/600x600?access_token=${mapboxToken}`,
      }
    },]

    testTable.forEach((table: TestTable) => {
      const url = convert(table.input, defaultOpts())
      expect(url).toBe(table.expected.url!)
    })
  })


})
