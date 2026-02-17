import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar Date
  scalar JSON

  # Enums
  enum UserRole {
    FARMER
    BUYER
    SUPPLIER
    ADMIN
  }

  enum ProductStatus {
    ACTIVE
    UNDER_BID
    SOLD
    CANCELLED
  }

  enum BidStatus {
    PENDING
    ACCEPTED
    REJECTED
    COUNTERED
    EXPIRED
  }

  enum LandAreaUnit {
    BIGHA
    HECTARE
    ACRE
  }

  enum NotificationType {
    INFO
    SUCCESS
    WARNING
    ERROR
  }

  # Types
  type User {
    id: ID!
    role: UserRole!
    name: String!
    phone: String
    email: String
    avatarUrl: String
    phoneVerified: Boolean!
    emailVerified: Boolean!
    createdAt: Date!
    updatedAt: Date!
    farmerProfile: FarmerProfile
    buyerProfile: BuyerProfile
    supplierProfile: SupplierProfile
  }

  type FarmerProfile {
    id: ID!
    userId: ID!
    village: String
    district: String!
    state: String!
    pincode: String
    about: String
    landAreaValue: Float
    landAreaUnit: LandAreaUnit
    rating: Float
    totalRatings: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  type BuyerProfile {
    id: ID!
    userId: ID!
    businessName: String!
    businessAddress: String
    district: String!
    state: String!
    pincode: String
    contactPerson: String
    rating: Float
    totalRatings: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  type SupplierProfile {
    id: ID!
    userId: ID!
    serviceTypes: [String!]!
    coverageAreas: [String!]!
    about: String
    rating: Float
    totalRatings: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  type Product {
    id: ID!
    farmerId: ID!
    farmer: User!
    categoryId: ID!
    category: ProductCategory!
    nameEn: String!
    nameHi: String
    descriptionEn: String
    descriptionHi: String
    quantity: Float!
    unit: String!
    expectedPrice: Float!
    finalPrice: Float
    images: [String!]!
    status: ProductStatus!
    harvestDate: Date
    expiryDate: Date
    createdAt: Date!
    updatedAt: Date!
    bids: [Bid!]!
    bidCount: Int!
    testResults: [TestResult!]!
  }

  type ProductCategory {
    id: ID!
    nameEn: String!
    nameHi: String!
    descriptionEn: String
    descriptionHi: String
    imageUrl: String
    parentId: ID
    parent: ProductCategory
    children: [ProductCategory!]!
    isActive: Boolean!
    sortOrder: Int!
  }

  type Bid {
    id: ID!
    productId: ID!
    product: Product!
    buyerId: ID!
    buyer: User!
    offeredPrice: Float!
    quantity: Float!
    status: BidStatus!
    message: String
    counterPrice: Float
    counterMessage: String
    negotiationRound: Int!
    expiresAt: Date
    createdAt: Date!
    updatedAt: Date!
    history: [BidHistory!]!
  }

  type BidHistory {
    id: ID!
    bidId: ID!
    action: String!
    price: Float
    message: String
    userId: ID!
    user: User!
    createdAt: Date!
  }

  type TestRequest {
    id: ID!
    productId: ID!
    product: Product!
    buyerId: ID!
    buyer: User!
    providerId: ID
    provider: User
    testType: String!
    scheduledDate: Date
    completedDate: Date
    status: String!
    cost: Float
    createdAt: Date!
    updatedAt: Date!
    results: [TestResult!]!
  }

  type TestResult {
    id: ID!
    testRequestId: ID!
    testRequest: TestRequest!
    productId: ID!
    product: Product!
    overallGrade: String!
    qualityScore: Int!
    moistureContent: Float
    proteinContent: Float
    defects: JSON
    recommendations: [String!]!
    images: [String!]!
    confidence: Float!
    testDate: Date!
    createdAt: Date!
  }

  type Notification {
    id: ID!
    userId: ID!
    title: String!
    message: String!
    type: NotificationType!
    isRead: Boolean!
    metadata: JSON
    createdAt: Date!
  }

  type Order {
    id: ID!
    orderNumber: String!
    productId: ID!
    product: Product!
    buyerId: ID!
    buyer: User!
    farmerId: ID!
    farmer: User!
    quantity: Float!
    price: Float!
    totalAmount: Float!
    status: String!
    paymentStatus: String!
    deliveryAddress: String!
    expectedDeliveryDate: Date
    actualDeliveryDate: Date
    createdAt: Date!
    updatedAt: Date!
  }

  # Input Types
  input RegisterFarmerInput {
    phone: String!
    name: String!
    aadhaar: String!
    village: String
    district: String!
    state: String!
    pincode: String
    about: String
    landAreaValue: Float
    landAreaUnit: LandAreaUnit
  }

  input RegisterBuyerInput {
    gst: String!
    businessName: String!
    email: String!
    password: String!
    phone: String!
    businessAddress: String
    district: String!
    state: String!
    pincode: String
    contactPerson: String
  }

  input CreateProductInput {
    nameEn: String!
    nameHi: String
    categoryId: ID!
    descriptionEn: String
    descriptionHi: String
    quantity: Float!
    unit: String!
    expectedPrice: Float!
    harvestDate: String
    expiryDate: String
  }

  input UpdateProductInput {
    nameEn: String
    nameHi: String
    categoryId: ID
    descriptionEn: String
    descriptionHi: String
    quantity: Float
    unit: String
    expectedPrice: Float
    status: ProductStatus
    harvestDate: String
    expiryDate: String
  }

  input CreateBidInput {
    productId: ID!
    offeredPrice: Float!
    quantity: Float!
    message: String
  }

  input ProductFilters {
    category: String
    state: String
    district: String
    minPrice: Float
    maxPrice: Float
    search: String
    status: ProductStatus
    farmerId: ID
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  input SortInput {
    field: String = "createdAt"
    order: String = "desc"
  }

  # Response Types
  type AuthResponse {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type ProductsResponse {
    products: [Product!]!
    pagination: PaginationInfo!
  }

  type BidsResponse {
    bids: [Bid!]!
    pagination: PaginationInfo!
  }

  type NotificationsResponse {
    notifications: [Notification!]!
    unreadCount: Int!
    pagination: PaginationInfo!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type UserStats {
    totalProducts: Int
    activeProducts: Int
    totalBids: Int
    acceptedBids: Int
    totalOrders: Int
    pendingBids: Int
  }

  # Queries
  type Query {
    # User queries
    me: User
    userStats: UserStats!
    
    # Product queries
    products(filters: ProductFilters, pagination: PaginationInput, sort: SortInput): ProductsResponse!
    product(id: ID!): Product
    productCategories: [ProductCategory!]!
    farmerProducts(pagination: PaginationInput): ProductsResponse!
    
    # Bid queries
    productBids(productId: ID!, pagination: PaginationInput): BidsResponse!
    buyerBids(pagination: PaginationInput): BidsResponse!
    bid(id: ID!): Bid
    
    # Notification queries
    notifications(pagination: PaginationInput, unreadOnly: Boolean): NotificationsResponse!
    
    # Test queries
    testRequests(pagination: PaginationInput): [TestRequest!]!
    testResults(productId: ID!): [TestResult!]!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    requestOTP(phone: String!): Boolean!
    verifyOTP(phone: String!, otp: String!): AuthResponse
    registerFarmer(input: RegisterFarmerInput!): AuthResponse!
    registerBuyer(input: RegisterBuyerInput!): User!
    login(gst: String!, password: String!): AuthResponse!
    refreshToken(refreshToken: String!): AuthResponse!
    logout: Boolean!
    
    # Product mutations
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Bid mutations
    createBid(input: CreateBidInput!): Bid!
    updateBidStatus(bidId: ID!, status: BidStatus!, counterPrice: Float, message: String): Bid!
    counterBid(bidId: ID!, counterPrice: Float!, message: String): Bid!
    acceptCounterBid(bidId: ID!): Bid!
    rejectCounterBid(bidId: ID!, message: String): Bid!
    
    # Notification mutations
    markNotificationRead(id: ID!): Boolean!
    markAllNotificationsRead: Boolean!
    
    # Test mutations
    scheduleTest(productId: ID!, testType: String!): TestRequest!
  }

  # Subscriptions
  type Subscription {
    # Real-time bid updates
    bidUpdated(productId: ID!): Bid!
    newBid(farmerId: ID!): Bid!
    
    # Notifications
    newNotification(userId: ID!): Notification!
    
    # Product updates
    productStatusChanged(productId: ID!): Product!
  }
`;