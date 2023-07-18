import { ethers } from "ethers";

export const isAddress = (address: string) => {
	return ethers.isAddress(address);
};

export const isBytes = (bytes: string) => {
	return ethers.isBytesLike(bytes);
};

export const isBytes32 = (bytes32: string) => {
	return ethers.isBytesLike(bytes32) && ethers.getBytes(bytes32).length === 32;
};

export const seconds = (seconds: number = 1) => {
	return seconds;
};

export const minutes = (minutes: number = 1) => {
	return minutes * seconds(60);
};

export const hours = (hours: number = 1) => {
	return hours * minutes(60);
};

export const days = (days: number = 1) => {
	return days * hours(24);
};

export const weeks = (weeks: number = 1) => {
	return weeks * days(7);
};

export const months = (months: number = 1) => {
	return months * weeks(4);
};
