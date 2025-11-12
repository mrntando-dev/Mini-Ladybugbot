const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

class NtandoStore {
    constructor() {
        this.productsFile = './store_products.json'
        this.ordersFile = './store_orders.json'
        this.customersFile = './store_customers.json'
        this.settingsFile = './store_settings.json'
        this.transactionsFile = './store_transactions.json'
        this.analyticsFile = './store_analytics.json'
        this.cartFile = './store_carts.json'
        this.wishlistFile = './store_wishlists.json'
        this.reviewsFile = './store_reviews.json'
        this.couponsFile = './store_coupons.json'
        this.Nano = null
        
        this.initializeFiles()
        this.loadData()
    }

    initialize(NanoInstance) {
        this.Nano = NanoInstance
        console.log(chalk.green('✓ NtandoStore module initialized'))
    }

    initializeFiles() {
        const files = [
            { path: this.productsFile, default: [] },
            { path: this.ordersFile, default: [] },
            { path: this.customersFile, default: {} },
            { path: this.settingsFile, default: this.getDefaultSettings() },
            { path: this.transactionsFile, default: [] },
            { path: this.analyticsFile, default: this.getDefaultAnalytics() },
            { path: this.cartFile, default: {} },
            { path: this.wishlistFile, default: {} },
            { path: this.reviewsFile, default: {} },
            { path: this.couponsFile, default: [] }
        ]

        files.forEach(file => {
            if (!fs.existsSync(file.path)) {
                fs.writeFileSync(file.path, JSON.stringify(file.default, null, 2))
            }
        })
    }

    getDefaultSettings() {
        return {
            storeName: 'NtandoStore',
            storeDescription: 'Your trusted online store',
            currency: '$',
            taxRate: 0.15,
            shippingFee: 5,
            freeShippingThreshold: 50,
            paymentMethods: ['Cash on Delivery', 'Bank Transfer', 'Mobile Money', 'EcoCash', 'OneMoney'],
            maxOrdersPerDay: 10,
            autoConfirm: false,
            allowReviews: true,
            requireApproval: true,
            notifications: {
                newOrder: true,
                orderConfirmed: true,
                orderShipped: true,
                orderDelivered: true,
                orderCancelled: true,
                lowStock: true,
                newReview: true,
                paymentReceived: true
            },
            workingHours: {
                enabled: true,
                start: '08:00',
                end: '20:00',
                timezone: 'Africa/Harare',
                workingDays: [1, 2, 3, 4, 5, 6] // Monday to Saturday
            },
            minOrderAmount: 1,
            maxOrderAmount: 10000,
            stockAlertThreshold: 5,
            autoBackup: true,
            backupInterval: 86400000 // 24 hours
        }
    }

    getDefaultAnalytics() {
        return {
            totalSales: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            topProducts: [],
            topCustomers: [],
            salesByDate: {},
            salesByMonth: {},
            ordersByStatus: {
                pending: 0,
                confirmed: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0
            },
            lastUpdated: new Date().toISOString()
        }
    }

    loadData() {
        try {
            this.products = JSON.parse(fs.readFileSync(this.productsFile, 'utf8'))
            this.orders = JSON.parse(fs.readFileSync(this.ordersFile, 'utf8'))
            this.customers = JSON.parse(fs.readFileSync(this.customersFile, 'utf8'))
            this.settings = JSON.parse(fs.readFileSync(this.settingsFile, 'utf8'))
            this.transactions = JSON.parse(fs.readFileSync(this.transactionsFile, 'utf8'))
            this.analytics = JSON.parse(fs.readFileSync(this.analyticsFile, 'utf8'))
            this.carts = JSON.parse(fs.readFileSync(this.cartFile, 'utf8'))
            this.wishlists = JSON.parse(fs.readFileSync(this.wishlistFile, 'utf8'))
            this.reviews = JSON.parse(fs.readFileSync(this.reviewsFile, 'utf8'))
            this.coupons = JSON.parse(fs.readFileSync(this.couponsFile, 'utf8'))
        } catch (err) {
            console.log(chalk.red('Error loading store data:', err.message))
        }
    }

    saveData(type) {
        try {
            const dataMap = {
                products: { data: this.products, file: this.productsFile },
                orders: { data: this.orders, file: this.ordersFile },
                customers: { data: this.customers, file: this.customersFile },
                settings: { data: this.settings, file: this.settingsFile },
                transactions: { data: this.transactions, file: this.transactionsFile },
                analytics: { data: this.analytics, file: this.analyticsFile },
                carts: { data: this.carts, file: this.cartFile },
                wishlists: { data: this.wishlists, file: this.wishlistFile },
                reviews: { data: this.reviews, file: this.reviewsFile },
                coupons: { data: this.coupons, file: this.couponsFile }
            }

            if (dataMap[type]) {
                fs.writeFileSync(dataMap[type].file, JSON.stringify(dataMap[type].data, null, 2))
                return true
            }
            return false
        } catch (err) {
            console.log(chalk.red(`Error saving ${type}:`, err.message))
            return false
        }
    }

    // Product Management
    addProduct(productData) {
        const product = {
            id: Date.now().toString(),
            name: productData.name,
            description: productData.description || '',
            price: parseFloat(productData.price),
            comparePrice: productData.comparePrice ? parseFloat(productData.comparePrice) : null,
            stock: parseInt(productData.stock) || 0,
            category: productData.category || 'General',
            tags: productData.tags || [],
            images: productData.images || [],
            sku: productData.sku || this.generateSKU(),
            weight: productData.weight || 0,
            dimensions: productData.dimensions || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            featured: productData.featured || false,
            sales: 0,
            views: 0,
            rating: 0,
            reviewCount: 0
        }

        this.products.push(product)
        this.saveData('products')
        return product
    }

    updateProduct(productId, updates) {
        const index = this.products.findIndex(p => p.id === productId)
        if (index !== -1) {
            this.products[index] = {
                ...this.products[index],
                ...updates,
                updatedAt: new Date().toISOString()
            }
            this.saveData('products')
            return this.products[index]
        }
        return null
    }

    deleteProduct(productId) {
        const index = this.products.findIndex(p => p.id === productId)
        if (index !== -1) {
            const deleted = this.products.splice(index, 1)
            this.saveData('products')
            return deleted[0]
        }
        return null
    }

    getProduct(productId) {
        const product = this.products.find(p => p.id === productId)
        if (product) {
            product.views++
            this.saveData('products')
        }
        return product
    }

    getAllProducts(filters = {}) {
        let filtered = [...this.products]

        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category)
        }

        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status)
        }

        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= filters.minPrice)
        }

        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice)
        }

        if (filters.inStock) {
            filtered = filtered.filter(p => p.stock > 0)
        }

        if (filters.featured) {
            filtered = filtered.filter(p => p.featured)
        }

        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(p => 
                filters.tags.some(tag => p.tags.includes(tag))
            )
        }

        return filtered
    }

    searchProducts(query) {
        const lowerQuery = query.toLowerCase()
        return this.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
    }

    generateSKU() {
        return 'SKU-' + Date.now().toString(36).toUpperCase()
    }

    // Order Management
    createOrder(orderData) {
        const order = {
            id: this.generateOrderId(),
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            customerAddress: orderData.customerAddress,
            items: orderData.items,
            subtotal: this.calculateSubtotal(orderData.items),
            tax: 0,
            shippingFee: 0,
            discount: 0,
            couponCode: orderData.couponCode || null,
            total: 0,
            status: 'pending',
            paymentMethod: orderData.paymentMethod,
            paymentStatus: 'unpaid',
            notes: orderData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deliveryDate: null,
            trackingNumber: null,
            history: [{
                status: 'pending',
                timestamp: new Date().toISOString(),
                note: 'Order created'
            }]
        }

        // Apply coupon if provided
        if (order.couponCode) {
            const coupon = this.getCoupon(order.couponCode)
            if (coupon && this.validateCoupon(coupon)) {
                order.discount = this.calculateDiscount(order.subtotal, coupon)
            }
        }

        // Calculate tax
        order.tax = order.subtotal * this.settings.taxRate

        // Calculate shipping
        if (order.subtotal < this.settings.freeShippingThreshold) {
            order.shippingFee = this.settings.shippingFee
        }

        // Calculate total
        order.total = order.subtotal + order.tax + order.shippingFee - order.discount

        // Update stock
        order.items.forEach(item => {
            this.updateStock(item.productId, -item.quantity)
        })

        this.orders.push(order)
        this.saveData('orders')

        // Update customer data
        this.updateCustomerOrder(order.customerId, order)

        // Update analytics
        this.updateAnalytics('newOrder', order)

        // Send notification
        if (this.settings.notifications.newOrder && this.Nano) {
            this.sendOrderNotification(order, 'new')
        }

        return order
    }

    generateOrderId() {
        const timestamp = Date.now().toString(36).toUpperCase()
        const random = Math.random().toString(36).substr(2, 5).toUpperCase()
        return `ORD-$${timestamp}-$$ {random}`
    }

    calculateSubtotal(items) {
        return items.reduce((total, item) => {
            const product = this.getProduct(item.productId)
            return total + (product.price * item.quantity)
        }, 0)
    }

    updateOrderStatus(orderId, status, note = '') {
        const order = this.orders.find(o => o.id === orderId)
        if (!order) return null

        order.status = status
        order.updatedAt = new Date().toISOString()
        order.history.push({
            status: status,
            timestamp: new Date().toISOString(),
            note: note
        })

        if (status === 'delivered') {
            order.deliveryDate = new Date().toISOString()
        }

        this.saveData('orders')

        // Update analytics
        this.updateAnalytics('statusChange', order)

        // Send notification
        if (this.Nano) {
            const notificationKey = `order$${status.charAt(0).toUpperCase()}$$ {status.slice(1)}`
            if (this.settings.notifications[notificationKey]) {
                this.sendOrderNotification(order, status)
            }
        }

        return order
    }

    getOrder(orderId) {
        return this.orders.find(o => o.id === orderId)
    }

    getCustomerOrders(customerId) {
        return this.orders.filter(o => o.customerId === customerId)
    }

    getAllOrders(filters = {}) {
        let filtered = [...this.orders]

        if (filters.status) {
            filtered = filtered.filter(o => o.status === filters.status)
        }

        if (filters.paymentStatus) {
            filtered = filtered.filter(o => o.paymentStatus === filters.paymentStatus)
        }

        if (filters.customerId) {
            filtered = filtered.filter(o => o.customerId === filters.customerId)
        }

        if (filters.startDate) {
            filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(filters.startDate))
        }

        if (filters.endDate) {
            filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(filters.endDate))
        }

        return filtered
    }

    cancelOrder(orderId, reason = '') {
        const order = this.getOrder(orderId)
        if (!order) return null

        if (['delivered', 'cancelled'].includes(order.status)) {
            return { error: 'Cannot cancel order with current status' }
        }

        // Restore stock
        order.items.forEach(item => {
            this.updateStock(item.productId, item.quantity)
        })

        return this.updateOrderStatus(orderId, 'cancelled', reason)
    }

    // Stock Management
    updateStock(productId, quantity) {
        const product = this.getProduct(productId)
        if (!product) return false

        product.stock += quantity
        this.saveData('products')

        // Check for low stock
        if (product.stock <= this.settings.stockAlertThreshold && 
            this.settings.notifications.lowStock && 
            this.Nano) {
            this.sendLowStockAlert(product)
        }

        return true
    }

    // Cart Management
    addToCart(userId, productId, quantity = 1) {
        if (!this.carts[userId]) {
            this.carts[userId] = {
                items: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }

        const existingItem = this.carts[userId].items.find(i => i.productId === productId)
        
        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            this.carts[userId].items.push({
                productId,
                quantity,
                addedAt: new Date().toISOString()
            })
        }

        this.carts[userId].updatedAt = new Date().toISOString()
        this.saveData('carts')
        return this.carts[userId]
    }

    removeFromCart(userId, productId) {
        if (!this.carts[userId]) return null

        this.carts[userId].items = this.carts[userId].items.filter(i => i.productId !== productId)
        this.carts[userId].updatedAt = new Date().toISOString()
        this.saveData('carts')
        return this.carts[userId]
    }

    updateCartQuantity(userId, productId, quantity) {
        if (!this.carts[userId]) return null

        const item = this.carts[userId].items.find(i => i.productId === productId)
        if (item) {
            item.quantity = quantity
            this.carts[userId].updatedAt = new Date().toISOString()
            this.saveData('carts')
        }
        return this.carts[userId]
    }

    getCart(userId) {
        return this.carts[userId] || { items: [] }
    }

    clearCart(userId) {
        delete this.carts[userId]
        this.saveData('carts')
        return true
    }

    getCartTotal(userId) {
        const cart = this.getCart(userId)
        return cart.items.reduce((total, item) => {
            const product = this.getProduct(item.productId)
            return total + (product ? product.price * item.quantity : 0)
        }, 0)
    }

    // Wishlist Management
    addToWishlist(userId, productId) {
        if (!this.wishlists[userId]) {
            this.wishlists[userId] = []
        }

        if (!this.wishlists[userId].includes(productId)) {
            this.wishlists[userId].push(productId)
            this.saveData('wishlists')
        }

        return this.wishlists[userId]
    }

    removeFromWishlist(userId, productId) {
        if (!this.wishlists[userId]) return []

        this.wishlists[userId] = this.wishlists[userId].filter(id => id !== productId)
        this.saveData('wishlists')
        return this.wishlists[userId]
    }

    getWishlist(userId) {
        return this.wishlists[userId] || []
    }

    // Review Management
    addReview(reviewData) {
        const review = {
            id: Date.now().toString(),
            productId: reviewData.productId,
            userId: reviewData.userId,
            userName: reviewData.userName,
            rating: parseInt(reviewData.rating),
            comment: reviewData.comment || '',
            images: reviewData.images || [],
            createdAt: new Date().toISOString(),
            status: this.settings.requireApproval ? 'pending' : 'approved',
            helpful: 0,
            notHelpful: 0
        }

        if (!this.reviews[reviewData.productId]) {
            this.reviews[reviewData.productId] = []
        }

        this.reviews[reviewData.productId].push(review)
        this.saveData('reviews')

        // Update product rating
        this.updateProductRating(reviewData.productId)

        // Send notification
        if (this.settings.notifications.newReview && this.Nano) {
            this.sendReviewNotification(review)
        }

        return review
    }

    approveReview(productId, reviewId) {
        const reviews = this.reviews[productId]
        if (!reviews) return null

        const review = reviews.find(r => r.id === reviewId)
        if (review) {
            review.status = 'approved'
            this.saveData('reviews')
            this.updateProductRating(productId)
        }
        return review
    }

    getProductReviews(productId, approved = true) {
        const reviews = this.reviews[productId] || []
        return approved ? reviews.filter(r => r.status === 'approved') : reviews
    }

    updateProductRating(productId) {
        const reviews = this.getProductReviews(productId)
        const product = this.getProduct(productId)
        
        if (!product) return

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
            product.rating = (totalRating / reviews.length).toFixed(1)
            product.reviewCount = reviews.length
        } else {
            product.rating = 0
            product.reviewCount = 0
        }

        this.saveData('products')
    }

    // Coupon Management
    createCoupon(couponData) {
        const coupon = {
            id: Date.now().toString(),
            code: couponData.code.toUpperCase(),
            type: couponData.type, // 'percentage' or 'fixed'
            value: parseFloat(couponData.value),
            minOrderAmount: couponData.minOrderAmount || 0,
            maxDiscount: couponData.maxDiscount || null,
            usageLimit: couponData.usageLimit || null,
            usageCount: 0,
            startDate: couponData.startDate || new Date().toISOString(),
            endDate: couponData.endDate || null,
            status: 'active',
            createdAt: new Date().toISOString()
        }

        this.coupons.push(coupon)
        this.saveData('coupons')
        return coupon
    }

    getCoupon(code) {
        return this.coupons.find(c => c.code === code.toUpperCase())
    }

    validateCoupon(coupon) {
        if (coupon.status !== 'active') return false
        
        const now = new Date()
        if (coupon.startDate && new Date(coupon.startDate) > now) return false
        if (coupon.endDate && new Date(coupon.endDate) < now) return false
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return false

        return true
    }

    calculateDiscount(subtotal, coupon) {
        if (!this.validateCoupon(coupon)) return 0

        if (subtotal < coupon.minOrderAmount) return 0

        let discount = 0
        if (coupon.type === 'percentage') {
            discount = subtotal * (coupon.value / 100)
        } else {
            discount = coupon.value
        }

        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount
        }

        return discount
    }

    useCoupon(code) {
        const coupon = this.getCoupon(code)
        if (coupon) {
            coupon.usageCount++
            this.saveData('coupons')
        }
        return coupon
    }

    // Customer Management
    updateCustomerOrder(customerId, order) {
        if (!this.customers[customerId]) {
            this.customers[customerId] = {
                id: customerId,
                name: order.customerName,
                phone: order.customerPhone,
                address: order.customerAddress,
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: null,
                createdAt: new Date().toISOString(),
                status: 'active'
            }
        }

        this.customers[customerId].totalOrders++
        this.customers[customerId].totalSpent += order.total
        this.customers[customerId].lastOrderDate = order.createdAt
        this.saveData('customers')
    }

    getCustomer(customerId) {
        return this.customers[customerId]
    }

    getAllCustomers() {
        return Object.values(this.customers)
    }

    // Analytics
    updateAnalytics(type, data) {
        switch (type) {
            case 'newOrder':
                this.analytics.totalOrders++
                this.analytics.totalRevenue += data.total
                this.analytics.averageOrderValue = this.analytics.totalRevenue / this.analytics.totalOrders
                this.analytics.ordersByStatus[data.status]++
                
                const orderDate = new Date(data.createdAt).toISOString().split('T')[0]
                this.analytics.salesByDate[orderDate] = (this.analytics.salesByDate[orderDate] || 0) + data.total
                break

            case 'statusChange':
                // Update order status analytics
                break
        }

        this.analytics.lastUpdated = new Date().toISOString()
        this.saveData('analytics')
    }

    getAnalytics(period = 'all') {
        return this.analytics
    }

    getSalesReport(startDate, endDate) {
        const orders = this.getAllOrders({ startDate, endDate })
        
        return {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
            ordersByStatus: orders.reduce((acc, o) => {
                acc[o.status] = (acc[o.status] || 0) + 1
                return acc
            }, {}),
            topProducts: this.getTopProducts(orders),
            period: { start: startDate, end: endDate }
        }
    }

    getTopProducts(orders = null) {
        const ordersToAnalyze = orders || this.orders
        const productSales = {}

        ordersToAnalyze.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.productId]) {
                    const product = this.getProduct(item.productId)
                    productSales[item.productId] = {
                        product: product,
                        quantity: 0,
                        revenue: 0
                    }
                }
                productSales[item.productId].quantity += item.quantity
                productSales[item.productId].revenue += item.quantity * (this.getProduct(item.productId)?.price || 0)
            })
        })

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
    }

    // Notifications
    async sendOrderNotification(order, type) {
        if (!this.Nano) return

        let message = ''
        const owner = global.owner + '@s.whatsapp.net'

        switch (type) {
            case 'new':
                message = `🛒 *NEW ORDER RECEIVED*\n\n` +
                         `Order ID: *${order.id}*\n` +
                         `Customer: ${order.customerName}\n` +
                         `Phone: ${order.customerPhone}\n` +
                         `Total: $${this.settings.currency}$$ {order.total.toFixed(2)}\n` +
                         `Payment: ${order.paymentMethod}\n\n` +
                         `Items:\n${this.formatOrderItems(order.items)}\n\n` +
                         `📍 Address: ${order.customerAddress}`
                break

            case 'confirmed':
                message = `✅ *ORDER CONFIRMED*\n\n` +
                         `Order ID: *${order.id}*\n` +
                         `Your order has been confirmed and is being processed.\n\n` +
                         `We'll notify you when it's shipped!`
                break

            case 'shipped':
                message = `📦 *ORDER SHIPPED*\n\n` +
                         `Order ID: *${order.id}*\n` +
                         `Tracking: ${order.trackingNumber || 'N/A'}\n\n` +
                         `Your order is on its way!`
                break

            case 'delivered':
                message = `🎉 *ORDER DELIVERED*\n\n` +
                         `Order ID: *${order.id}*\n\n` +
                         `Thank you for shopping with us!\n` +
                         `Please leave a review if you enjoyed your purchase.`
                break

                        case 'cancelled':
                message = `❌ *ORDER CANCELLED*\n\n` +
                         `Order ID: *${order.id}*\n\n` +
                         `Your order has been cancelled.\n` +
                         `If you have any questions, please contact us.`
                break
        }

        try {
            // Send to owner for new orders
            if (type === 'new') {
                await this.Nano.sendMessage(owner, { text: message })
            }
            
            // Send to customer for status updates
            if (order.customerId && order.customerId !== owner) {
                await this.Nano.sendMessage(order.customerId, { text: message })
            }
        } catch (err) {
            console.log(chalk.red('Failed to send order notification:', err.message))
        }
    }

    async sendLowStockAlert(product) {
        if (!this.Nano) return

        const message = `⚠️ *LOW STOCK ALERT*\n\n` +
                       `Product: *${product.name}*\n` +
                       `SKU: ${product.sku}\n` +
                       `Current Stock: *${product.stock}* units\n\n` +
                       `Please restock soon!`

        try {
            const owner = global.owner + '@s.whatsapp.net'
            await this.Nano.sendMessage(owner, { text: message })
        } catch (err) {
            console.log(chalk.red('Failed to send low stock alert:', err.message))
        }
    }

    async sendReviewNotification(review) {
        if (!this.Nano) return

        const product = this.getProduct(review.productId)
        if (!product) return

        const message = `⭐ *NEW PRODUCT REVIEW*\n\n` +
                       `Product: *${product.name}*\n` +
                       `Rating: ${'⭐'.repeat(review.rating)}\n` +
                       `Customer: ${review.userName}\n` +
                       `Comment: ${review.comment || 'No comment'}\n\n` +
                       `Review Status: ${review.status}`

        try {
            const owner = global.owner + '@s.whatsapp.net'
            await this.Nano.sendMessage(owner, { text: message })
        } catch (err) {
            console.log(chalk.red('Failed to send review notification:', err.message))
        }
    }

    formatOrderItems(items) {
        return items.map(item => {
            const product = this.getProduct(item.productId)
            if (!product) return `- Unknown product x${item.quantity}`
            return `- $${product.name} x$$ {item.quantity} - $${this.settings.currency}$$ {(product.price * item.quantity).toFixed(2)}`
        }).join('\n')
    }

    // Settings Management
    updateSettings(updates) {
        this.settings = {
            ...this.settings,
            ...updates
        }
        this.saveData('settings')
        return this.settings
    }

    getSettings() {
        return this.settings
    }

    // Backup and Export
    createBackup() {
        try {
            const backupDir = './store_backups'
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir)
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const backupFile = path.join(backupDir, `backup_${timestamp}.json`)

            const backupData = {
                products: this.products,
                orders: this.orders,
                customers: this.customers,
                settings: this.settings,
                transactions: this.transactions,
                analytics: this.analytics,
                carts: this.carts,
                wishlists: this.wishlists,
                reviews: this.reviews,
                coupons: this.coupons,
                backupDate: new Date().toISOString()
            }

            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
            console.log(chalk.green(`✓ Backup created: ${backupFile}`))
            
            // Clean old backups (keep last 10)
            this.cleanOldBackups(backupDir, 10)
            
            return backupFile
        } catch (err) {
            console.log(chalk.red('Failed to create backup:', err.message))
            return null
        }
    }

    cleanOldBackups(backupDir, keepCount = 10) {
        try {
            const files = fs.readdirSync(backupDir)
                .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time)

            if (files.length > keepCount) {
                files.slice(keepCount).forEach(file => {
                    fs.unlinkSync(file.path)
                    console.log(chalk.yellow(`🗑️ Deleted old backup: ${file.name}`))
                })
            }
        } catch (err) {
            console.log(chalk.red('Failed to clean old backups:', err.message))
        }
    }

    restoreBackup(backupFile) {
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'))

            this.products = backupData.products || []
            this.orders = backupData.orders || []
            this.customers = backupData.customers || {}
            this.settings = backupData.settings || this.getDefaultSettings()
            this.transactions = backupData.transactions || []
            this.analytics = backupData.analytics || this.getDefaultAnalytics()
            this.carts = backupData.carts || {}
            this.wishlists = backupData.wishlists || {}
            this.reviews = backupData.reviews || {}
            this.coupons = backupData.coupons || []

            // Save all data
            this.saveData('products')
            this.saveData('orders')
            this.saveData('customers')
            this.saveData('settings')
            this.saveData('transactions')
            this.saveData('analytics')
            this.saveData('carts')
            this.saveData('wishlists')
            this.saveData('reviews')
            this.saveData('coupons')

            console.log(chalk.green('✓ Backup restored successfully'))
            return true
        } catch (err) {
            console.log(chalk.red('Failed to restore backup:', err.message))
            return false
        }
    }

    exportToCSV(dataType) {
        try {
            let csvContent = ''
            let filename = ''

            switch (dataType) {
                case 'products':
                    csvContent = this.productsToCSV()
                    filename = `products_${Date.now()}.csv`
                    break
                case 'orders':
                    csvContent = this.ordersToCSV()
                    filename = `orders_${Date.now()}.csv`
                    break
                case 'customers':
                    csvContent = this.customersToCSV()
                    filename = `customers_${Date.now()}.csv`
                    break
                default:
                    return null
            }

            const exportDir = './store_exports'
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir)
            }

            const filepath = path.join(exportDir, filename)
            fs.writeFileSync(filepath, csvContent)
            console.log(chalk.green(`✓ Exported to: ${filepath}`))
            return filepath
        } catch (err) {
            console.log(chalk.red('Failed to export data:', err.message))
            return null
        }
    }

    productsToCSV() {
        const headers = 'ID,Name,Description,Price,Stock,Category,SKU,Status,Sales,Rating,Reviews\n'
        const rows = this.products.map(p => 
            `${p.id},"${p.name}","${p.description}",$${p.price},$$ {p.stock},$${p.category},$$ {p.sku},$${p.status},$$ {p.sales},$${p.rating},$$ {p.reviewCount}`
        ).join('\n')
        return headers + rows
    }

    ordersToCSV() {
        const headers = 'Order ID,Customer,Phone,Total,Status,Payment Method,Payment Status,Date\n'
        const rows = this.orders.map(o => 
            `${o.id},"${o.customerName}",$${o.customerPhone},$$ {o.total},$${o.status},$$ {o.paymentMethod},$${o.paymentStatus},$$ {o.createdAt}`
        ).join('\n')
        return headers + rows
    }

    customersToCSV() {
        const headers = 'Customer ID,Name,Phone,Total Orders,Total Spent,Last Order,Status\n'
        const rows = Object.values(this.customers).map(c => 
            `${c.id},"${c.name}",$${c.phone},$$ {c.totalOrders},$${c.totalSpent},$$ {c.lastOrderDate || 'N/A'},${c.status}`
        ).join('\n')
        return headers + rows
    }

    // Utility Methods
    getCategories() {
        const categories = [...new Set(this.products.map(p => p.category))]
        return categories.sort()
    }

    getOrderStatistics() {
        return {
            total: this.orders.length,
            pending: this.orders.filter(o => o.status === 'pending').length,
            confirmed: this.orders.filter(o => o.status === 'confirmed').length,
            processing: this.orders.filter(o => o.status === 'processing').length,
            shipped: this.orders.filter(o => o.status === 'shipped').length,
            delivered: this.orders.filter(o => o.status === 'delivered').length,
            cancelled: this.orders.filter(o => o.status === 'cancelled').length,
            todayOrders: this.getTodayOrders().length,
            todayRevenue: this.getTodayOrders().reduce((sum, o) => sum + o.total, 0),
            unpaidOrders: this.orders.filter(o => o.paymentStatus === 'unpaid').length
        }
    }

    getTodayOrders() {
        const today = new Date().toISOString().split('T')[0]
        return this.orders.filter(o => o.createdAt.startsWith(today))
    }

    getLowStockProducts() {
        return this.products.filter(p => p.stock <= this.settings.stockAlertThreshold && p.stock > 0)
    }

    getOutOfStockProducts() {
        return this.products.filter(p => p.stock === 0)
    }

    getTopSellingProducts(limit = 10) {
        return [...this.products]
            .sort((a, b) => b.sales - a.sales)
            .slice(0, limit)
    }

    getRecentOrders(limit = 10) {
        return [...this.orders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit)
    }

    searchOrders(query) {
        const lowerQuery = query.toLowerCase()
        return this.orders.filter(o => 
            o.id.toLowerCase().includes(lowerQuery) ||
            o.customerName.toLowerCase().includes(lowerQuery) ||
            o.customerPhone.includes(query)
        )
    }

    // Payment Management
    markOrderAsPaid(orderId, transactionDetails = {}) {
        const order = this.getOrder(orderId)
        if (!order) return null

        order.paymentStatus = 'paid'
        order.updatedAt = new Date().toISOString()

        // Record transaction
        const transaction = {
            id: Date.now().toString(),
            orderId: orderId,
            amount: order.total,
            method: order.paymentMethod,
            status: 'completed',
            reference: transactionDetails.reference || '',
            notes: transactionDetails.notes || '',
            timestamp: new Date().toISOString()
        }

        this.transactions.push(transaction)
        this.saveData('orders')
        this.saveData('transactions')

        // Send notification
        if (this.settings.notifications.paymentReceived && this.Nano) {
            this.sendPaymentNotification(order, transaction)
        }

        return { order, transaction }
    }

    async sendPaymentNotification(order, transaction) {
        if (!this.Nano) return

        const message = `💰 *PAYMENT RECEIVED*\n\n` +
                       `Order ID: *${order.id}*\n` +
                       `Amount: $${this.settings.currency}$$ {transaction.amount.toFixed(2)}\n` +
                       `Method: ${transaction.method}\n` +
                       `Reference: ${transaction.reference || 'N/A'}\n\n` +
                       `Thank you for your payment!`

        try {
            const owner = global.owner + '@s.whatsapp.net'
            await this.Nano.sendMessage(owner, { text: message })
            
            if (order.customerId && order.customerId !== owner) {
                await this.Nano.sendMessage(order.customerId, { text: message })
            }
        } catch (err) {
            console.log(chalk.red('Failed to send payment notification:', err.message))
        }
    }

    getTransactions(filters = {}) {
        let filtered = [...this.transactions]

        if (filters.orderId) {
            filtered = filtered.filter(t => t.orderId === filters.orderId)
        }

        if (filters.status) {
            filtered = filtered.filter(t => t.status === filters.status)
        }

        if (filters.method) {
            filtered = filtered.filter(t => t.method === filters.method)
        }

        if (filters.startDate) {
            filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(filters.startDate))
        }

        if (filters.endDate) {
            filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(filters.endDate))
        }

        return filtered
    }

    // Dashboard Data
    getDashboardData() {
        const today = new Date().toISOString().split('T')[0]
        const todayOrders = this.getTodayOrders()
        
        return {
            overview: {
                totalProducts: this.products.length,
                totalOrders: this.orders.length,
                totalCustomers: Object.keys(this.customers).length,
                totalRevenue: this.analytics.totalRevenue,
                todayOrders: todayOrders.length,
                todayRevenue: todayOrders.reduce((sum, o) => sum + o.total, 0),
                pendingOrders: this.orders.filter(o => o.status === 'pending').length,
                lowStockProducts: this.getLowStockProducts().length,
                outOfStockProducts: this.getOutOfStockProducts().length
            },
            recentOrders: this.getRecentOrders(5),
            topProducts: this.getTopSellingProducts(5),
            orderStats: this.getOrderStatistics(),
            alerts: {
                lowStock: this.getLowStockProducts(),
                outOfStock: this.getOutOfStockProducts(),
                pendingOrders: this.orders.filter(o => o.status === 'pending')
            }
        }
    }

    // Validation Methods
    validateProduct(productData) {
        const errors = []

        if (!productData.name || productData.name.trim() === '') {
            errors.push('Product name is required')
        }

        if (!productData.price || isNaN(productData.price) || productData.price <= 0) {
            errors.push('Valid price is required')
        }

        if (productData.stock !== undefined && (isNaN(productData.stock) || productData.stock < 0)) {
            errors.push('Stock must be a non-negative number')
        }

        return {
            valid: errors.length === 0,
            errors: errors
        }
    }

    validateOrder(orderData) {
        const errors = []

        if (!orderData.customerId || orderData.customerId.trim() === '') {
            errors.push('Customer ID is required')
        }

        if (!orderData.customerName || orderData.customerName.trim() === '') {
            errors.push('Customer name is required')
        }

        if (!orderData.customerPhone || orderData.customerPhone.trim() === '') {
            errors.push('Customer phone is required')
        }

        if (!orderData.items || orderData.items.length === 0) {
            errors.push('Order must contain at least one item')
        }

        if (!orderData.paymentMethod || orderData.paymentMethod.trim() === '') {
            errors.push('Payment method is required')
        }

        // Validate items
        if (orderData.items) {
            orderData.items.forEach((item, index) => {
                const product = this.getProduct(item.productId)
                
                if (!product) {
                    errors.push(`Item ${index + 1}: Product not found`)
                } else if (product.stock < item.quantity) {
                    errors.push(`Item ${index + 1}: Insufficient stock (available: ${product.stock})`)
                }
            })
        }

        return {
            valid: errors.length === 0,
            errors: errors
        }
    }

    // Auto-backup scheduler
    startAutoBackup() {
        if (!this.settings.autoBackup) return

        this.backupInterval = setInterval(() => {
            console.log(chalk.cyan('🔄 Running automatic backup...'))
            this.createBackup()
        }, this.settings.backupInterval)

        console.log(chalk.green(`✓ Auto-backup enabled (every ${this.settings.backupInterval / 3600000} hours)`))
    }

    stopAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval)
            this.backupInterval = null
            console.log(chalk.yellow('⚠️ Auto-backup disabled'))
        }
    }
}

// Create and export singleton instance
const ntandoStore = new NtandoStore()

// Start auto-backup if enabled
if (ntandoStore.settings.autoBackup) {
    ntandoStore.startAutoBackup()
}

module.exports = ntandoStore
