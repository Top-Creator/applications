export interface GraphQLError {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[]
}

interface GraphQLResponse<T> {
    data: T;
    errors?: GraphQLError[];
}

export async function query<T>(url: string, token: string, query: string, variables: object = {}): Promise<T> {
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    }

    try {
        const response = await fetch(url, fetchOptions)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }

        const data: GraphQLResponse<T> = await response.json()
        if (data.errors) {
            console.error('GraphQL errors:', data.errors)
            throw new Error(data.errors.map((error) => error.message).join(', '))
        }

        return data.data
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
        throw error
    }
}


export async function mutation<T>(url: string, token: string, mutation: string, variables: object = {}): Promise<T> {
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            query: mutation,
            variables: variables
        })
    }

    try {
        const response = await fetch(url, fetchOptions)
        if (!response.ok) {
            throw new Error('Network response was not ok')
        }

        const data: GraphQLResponse<T> = await response.json()
        if (data.errors) {
            console.error('GraphQL errors:', data.errors)
            throw new Error(data.errors.map((error) => error.message).join(', '))
        }

        return data.data
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error)
        throw error
    }
}
