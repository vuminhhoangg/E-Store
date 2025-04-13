export interface Product {
    _id: string;
    name: string;
    image: string;
    brand: string;
    category: string;
    description: string;
    price: number;
    countInStock: number;
    rating: number;
    numReviews: number;
    createdAt: string;
    updatedAt: string;
    warrantyPeriodMonths: number;
    __v: number;
}

export interface CartItem {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

export interface Cart {
    _id: string;
    user: string;
    cartItems: CartItem[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}