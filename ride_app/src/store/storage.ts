
import { createMMKV, MMKV } from "react-native-mmkv"

export const tokenStorage: MMKV = createMMKV({
    id: "token-storage",
    encryptionKey: "abcd123456",


});

export const storage: MMKV = createMMKV({
    id: "my-app-storage",
    encryptionKey: "com.sid.ride",

})

export const mmkvStorage = {
    setItem: (key: string, value: string): void => {
        storage.set(key, value);

    },
    getItem: (key: string): string | null => {
        const value = storage.getString(key)
        return value ?? null
    },
    removeItem: (key: string): void => {
        storage.remove(key);
    }

}