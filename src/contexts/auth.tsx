import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";


type TAuthContextData = {
    user: TUser | null;
    signInUrl: string;
    signOut: () => void;
}


export const AuthContext = createContext({} as TAuthContextData)


type TUser = {
    id: string;
    name: string;
    login: string;
    avatar_url: string;
}

type TAuthProvider = {
    children: ReactNode;
}

type AuthResponse = {
    token: string;
    user: {
        id: string;
        avatar_url: string;
        name: string;
        login: string
    }
}

export function AuthProvider(props: TAuthProvider) {
    const [user, setUser] = useState<TUser | null>(null)

    const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=d009c8d85d42d27607cf`

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('authenticate', {
            code: githubCode
        })

        const { token, user } = response.data;

        localStorage.setItem('@dowhile:token', token)

        api.defaults.headers.common.authorization = `Bearer ${token}`;

        setUser(user)
    }

    function signOut() {
        setUser(null)
        localStorage.removeItem('@dowhile:token')
    }

    useEffect(() => {
        const token = localStorage.getItem('@dowhile:token')

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;

            api.get<TUser>('profile').then(response => {
                setUser(response.data)
            })
        }

    }, [])

    useEffect(() => {
        const url = window.location.href
        const hasGithubCode = url.includes("?code=")



        if (hasGithubCode) {
            const [urlWithoutCode, githubCode] = url.split("?code=")
            window.history.pushState({}, '', urlWithoutCode);

            signIn(githubCode)
        }
    }, [])

    return (
        <AuthContext.Provider value={{ signInUrl, user, signOut }}>
            {props.children}
        </AuthContext.Provider>
    )
}