The initial flow of the backend is 

Login -> Gain session cookie -> access APIs .

The GET apis pass query params , are paginated and rate limited ( tested my self sending 1 request every 10ms , a total 500 request , got status 429 after around 120 request .)

Intresting Things I found  :-

Was very happy when i found out this 
 , o = await crypto.subtle.importKey(`raw`, new TextEncoder().encode(r), {
        name: `HMAC`,
        hash: `SHA-256`
    }, !1, [`sign`])
      , s = await crypto.subtle.sign(`HMAC`, o, new TextEncoder().encode(a));
    return {
        timestamp: i,
        signature: [...new Uint8Array(s)].map(e => e.toString(16).padStart(2, `0`)).join(``)
    }

but then the api was dependent upon this api https://urja-ops.flockenergy.tech/portal/keys , so it was all good .
Which the export api used with this
x-signature
6f583183461456d1e11bbdaf7baa56031024c2c290b983222eac1f0746e4984a
x-timestamp
1793265069


