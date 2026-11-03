import AsyncStorage from "@react-native-async-storage/async-storage";

export const libraryStorage = {
  read: (key: string) => AsyncStorage.getItem(key),
  write: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
