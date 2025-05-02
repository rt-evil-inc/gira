export type MessageGetResponse = {
  message: string;
  timestamp: string;
  showAlways: boolean;
}

export type UsageStatisticsPostRequest = {
  deviceId: string;
  appVersion: string;
  os: string;
  osVersion: string;
}

export type UsageStatisticsPostResponse = {
  success: boolean;
}

export type TripStatisticsPostRequest = {
  deviceId: string;
  bikeSerial: string;
  stationSerial: string;
}

export type TripStatisticsPostResponse = {
  success: boolean;
}