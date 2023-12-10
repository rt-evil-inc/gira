export type ApiResponse<T> = {
    error: Error;
    data: T;
}

export type UserInfo = {
    id: string;
    name: string;
    nif: string;
    email: string;
    country: string;
    dateBirth: Date;
    dateCreate: Date;
    dateUpdate: Date;
    dateActivate: Date;
    dateTerms: Date;
    idType: string;
    typeName: string;
    nifCertifiedStatus: string;
    emailCertifiedStatus: string;
    rgpd: boolean;
    receiveInfoIncidents: boolean;
    receiveInfoEmel: boolean;
    receiveInfoPartners: boolean;
    dateRgpd: Date;
    services: Service[];
    phones: Phone[];
    address: Address;
    addressCMD: null;
    gender: null;
    navigatorCard: null;
}

export type Address = {
    street: string;
    number: string;
    numberComplement: null;
    floor: string;
    floorComplement: string;
    zipCode: string;
    place: string;
    county: string;
    tipo: string;
    dateCreate: Date;
    dateUpdate: null;
}

export type Phone = {
    id: string;
    countryCode: null;
    number: string;
    idType: string;
    typeName: string;
    certifiedStatus: string;
    dateCreate: Date;
}

export type Service = {
    id: string;
    idService: string;
    idLegacy: null | string;
    key: string;
    description: string;
    profiles: [];
}

export type Error = {
    code: number;
    message: string;
}

export type TokenOpt = {
		accessToken: string|null;
		refreshToken: string|null;
		expiration: number;
}