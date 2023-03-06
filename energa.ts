const LOGIN = process.env.ENERGA_LOGIN;
const PASSWORD = process.env.ENERGA_PASSWORD;
const FROM = 2022;
const METER_ID = `30466474`;

if (!LOGIN) throw new Error(`Missing ENERGA_LOGIN!`);
if (!PASSWORD) throw new Error(`Missing ENERGA_PASSWORD!`);

import Bluebird from "bluebird";
import puppeteer from "puppeteer";

export async function getData() {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    defaultViewport: { width: 1512, height: 944 },
    userDataDir: "",

    args: [`--window-size=1512,944`, `--no-sandbox`],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36`,
    {
      brands: [
        {
          brand: "Not_A Brand",
          version: "99",
        },
        {
          brand: "Google Chrome",
          version: "109",
        },
        {
          brand: "Chromium",
          version: "109",
        },
      ],
      mobile: false,
      platform: "macOS",
      platformVersion: "",
      architecture: "",
      model: "",
    }
  );
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  await login(page);
  const meterPoint = await selectMeter();
  const { consumedEnergyTotal, donatedEnergyTotal } = await readEnergyTotal(
    page
  );
  const { energyConsumed, energyDonated } = await readEnergyHistoryJson(
    page,
    Number.parseInt(meterPoint)
  );

  await browser.close();

  return {
    consumedEnergyTotal,
    donatedEnergyTotal,
    energyConsumed,
    energyDonated,
  };
}

// -------------------------------------------
// -------------------------------------------
// -------------------------------------------
// -------------------------------------------
// -------------------------------------------
// -------------------------------------------

async function login(page: puppeteer.Page) {
  await page.goto("https://mojlicznik.energa-operator.pl/dp/UserLogin.do");

  await page.evaluate(() =>
    document.querySelector<HTMLLabelElement>('label[for="loginRadio"]')?.click()
  );

  await page.type("#j_username", LOGIN);
  await page.type("#j_password", PASSWORD);
  await page.evaluate(() =>
    document.querySelector<HTMLLabelElement>('label[for="rememberMe"]')?.click()
  );
  await Promise.all([
    page.evaluate(() =>
      document
        .querySelector<HTMLLabelElement>('button[name="loginNow"]')
        ?.click()
    ),
    page.waitForNavigation(),
  ]);
}

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function selectMeter() {
  // @todo
  // const element = (await page.waitForSelector(
  //   `#meterSelectF`
  // )) as puppeteer.ElementHandle<HTMLSelectElement> | null;
  // const option = await element?.evaluate((select, METER_ID) => {
  //   return Array.from(select.children).find((option) =>
  //     option.textContent?.trim().startsWith(METER_ID)
  //   ) as HTMLOptionElement | undefined;
  // }, METER_ID);
  // await element?.select(option?.value!);
  // return option?.value!;
  return `16511293`;
}

async function readEnergyTotal(page: puppeteer.Page) {
  console.log(`readEnergyTotal()`);
  await page.goto(`https://mojlicznik.energa-operator.pl/dp/UserData.do`);
  const consumedEnergyTotal = await readWeirdNumber(page, 1);
  const donatedEnergyTotal = await readWeirdNumber(page, 3);
  return { consumedEnergyTotal, donatedEnergyTotal };
}

async function readEnergyHistoryJson(page: puppeteer.Page, meterPoint: number) {
  const currentYear = new Date().getFullYear();

  const years = Array(currentYear - FROM + 1)
    .fill(0)
    .map((_, i) => FROM + i);
  const { energyConsumed, energyDonated } = await Bluebird.mapSeries(
    years,
    async (year) => {
      const mainChartDate = new Date(
        `${year}-01-01T00:00:00.000+0100`
      ).getTime();
      const energyConsumed: ChartResponse = await (
        await page.goto(
          `https://mojlicznik.energa-operator.pl/dp/resources/chart?mainChartDate=${mainChartDate}&type=YEAR&meterPoint=${meterPoint}&mo=A%2B`
        )
      )?.json();
      const energyDonated: ChartResponse = await (
        await page.goto(
          `https://mojlicznik.energa-operator.pl/dp/resources/chart?mainChartDate=${mainChartDate}&type=YEAR&meterPoint=${meterPoint}&mo=A-`
        )
      )?.json();

      return { energyConsumed, energyDonated };
    }
  ).reduce(
    (
      acc: {
        energyConsumed: (readonly [tm: number, value: number])[];
        energyDonated: (readonly [tm: number, value: number])[];
      },
      { energyConsumed, energyDonated }
    ) => {
      acc.energyConsumed.push(...chartResponseToDatapoint(energyConsumed));
      acc.energyDonated.push(...chartResponseToDatapoint(energyDonated));
      return acc;
    },
    { energyConsumed: [], energyDonated: [] }
  );

  energyConsumed.sort(([a], [b]) => a - b);
  energyDonated.sort(([a], [b]) => a - b);

  return { energyConsumed, energyDonated };
}

function chartResponseToDatapoint(response: ChartResponse) {
  return response.response.mainChart.map(
    (el) => [Number(el.tm), Number(el.zones[0])] as const
  );
}

async function readWeirdNumber(page: puppeteer.Page, nth: number) {
  console.log(`readWeirdNumber(${nth})`);
  const donatedEnergyTotalEl = await page.waitForSelector(
    `div#right table tr:nth-of-type(${nth}) td.last`
  );
  return donatedEnergyTotalEl?.evaluate((el) => {
    return Number.parseFloat(
      el.innerText.replace(/[^0-9,]/g, "").replace(",", ".")
    );
  });
}

export interface ChartResponse {
  success: boolean;
  warning?: unknown;
  error?: unknown;
  status: number;
  response: {
    meterObjects?: unknown;
    meterPoints?: unknown;
    zones: {
      index: number;
      label: string;
    }[];
    tariffs?: unknown;
    simulatedCost?: unknown;
    meterObject: string;
    unit: string;
    precision: number;
    meterPoint: string;
    tariffName: string;
    tz: string;
    mainChartDate: string;
    comparisonChartDate?: unknown;
    mainChartDateTo: string;
    comparisonChartDateTo?: unknown;
    type: string;
    label1?: unknown;
    label3: string;
    alarmThreshold?: unknown;
    mainChart: {
      tm: string;
      tarAvg?: number;
      zones: unknown[];
      est: boolean;
      cplt: boolean;
    }[];
    comparisonChart?: unknown;
  };
}
