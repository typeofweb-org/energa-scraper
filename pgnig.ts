import { ChartData, fixContinuousReadings } from "./utils.js";

const _LOGIN = process.env.PGNIG_LOGIN;
const _PASSWORD = process.env.PGNIG_PASSWORD;

if (!_LOGIN) throw new Error(`Missing PGNIG_LOGIN!`);
const LOGIN = _LOGIN;
if (!_PASSWORD) throw new Error(`Missing PGNIG_PASSWORD!`);
const PASSWORD = _PASSWORD;

export async function getData() {
  const loginData = await login();
  const meterData = await readMeter(loginData.Token);

  const values = [
    ...fixContinuousReadings(
      meterData.MeterReadings.map((el) => el.Value).reverse()
    ),
  ].reverse();

  return {
    gasConsumed: meterData.MeterReadings.map((el, idx) => {
      return [new Date(el.ReadingDateUtc).getTime(), values[idx]] as const;
    }).reverse() as ChartData,
  };
}

const commonHeaders = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9,pl;q=0.8",
  "content-type": "application/json",
  "sec-ch-ua":
    '"Not_A Brand";v="99", "Google Chrome";v="109", "Chromium";v="109"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

async function login() {
  const res = await fetch("https://ebok.pgnig.pl/auth/login?api-version=3.0", {
    headers: {
      ...commonHeaders,
      Referer: "https://ebok.pgnig.pl/",
    },
    body: `{"identificator":"${LOGIN}","accessPin":"${PASSWORD}","rememberLogin":true,"DeviceId":"54c80d5e64dc61f0fcf764a060012e35","DeviceName":"Chrome wersja: 109.0.0.0<br>","DeviceType":"Web"}`,
    method: "POST",
  });

  if (!res.ok) {
    console.error(`login`, res.statusText);
    console.error(`login`, await res.json());
    throw new Error(res.statusText);
  }

  const json = await res.json();

  return json as LoginResponse;
}

async function readMeter(token: string) {
  const res = await fetch(
    "https://ebok.pgnig.pl/crm/get-all-ppg-readings-for-meter?pageNumber=1&pageSize=36&idPpg=8018590365500030056003&api-version=3.0",
    {
      headers: {
        ...commonHeaders,
        authtoken: token,
        Referer: "https://ebok.pgnig.pl/odczyt",
      },
      method: "GET",
    }
  );

  if (!res.ok) {
    console.error(`readMeter`, res.statusText);
    console.error(`readMeter`, await res.json());
    throw new Error(res.statusText);
  }

  const json = await res.json();
  return json as GetAllReadingsResponse;
}

interface LoginResponse {
  DateExpirationUtc: string;
  Token: string;
  AutomaticLoginToken: string;
  NewUser: boolean;
  IsActiveTransfer: boolean;
  HasBetaAccess: boolean;
  ForceChangePasswordByInvalidPolicy: boolean;
  ForceChangeUserNameToEmail: boolean;
  Code: number;
  Message?: any;
  DisplayToEndUser: boolean;
  EndUserMessage?: any;
  TokenExpireDate: string;
  TokenExpireDateUtc: string;
}

export interface GetAllReadingsResponse {
  MeterReadings: ReadonlyArray<{
    Status: string;
    CollectionPointAddress: {
      Ulica: string;
      NrBudynku: string;
      NrLokalu: string;
      KodPocztowy: string;
      Miejscowosc: string;
    };
    ReadingDateLocal: string;
    ReadingDateUtc: string;
    PpId: string;
    Value: number;
    Value2?: any;
    Value3?: any;
    ClientNumber: string;
    MeterNumber: string;
    PhoneNumber: string;
    RegionCode: string;
    PeselNip: string;
    Wear: number;
    Type: string;
    Color: string;
    AgreementName: string;
  }>;
  Code: number;
  Message?: any;
  DisplayToEndUser: boolean;
  EndUserMessage?: any;
  TokenExpireDate: string;
  TokenExpireDateUtc: string;
}
