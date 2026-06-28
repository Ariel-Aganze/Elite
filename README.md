# Elite Trade Backend API

## Multi-Tenant ERP System for Retail & Distribution

---

## 📋 Overview

Elite Trade is a **multi-tenant, offline-first ERP system** designed for retail and distribution businesses operating in challenging network environments (like the DRC). This backend API serves both web and mobile applications with a robust REST API.

### Key Features

- ✅ **Multi-Tenant SaaS Architecture** - Isolated companies with shared infrastructure
- ✅ **Offline-First Sync Engine** - Full offline support for mobile app (USP)
- ✅ **Flexible Permission System** - Granular, capability-based user permissions
- ✅ **Multi-Currency Support** - USD, CDF, and extensible to other currencies
- ✅ **Multi-Language Support** - French (primary) and English (secondary)
- ✅ **Complete Commercial Management** - From purchases to sales
- ✅ **Multi-Branch Management** - Centralized control with branch isolation
- ✅ **JWT Authentication** - Secure, token-based authentication
- ✅ **API Documentation** - Swagger UI and ReDoc

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 15+
- pip (Python package manager)
- virtualenv (recommended)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Ariel-Aganze/elite-backend.git
cd elite-backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Edit .env with your database credentials

# 5. Create PostgreSQL database
createdb -U postgres elite_db

# 6. Run migrations
python manage.py makemigrations
python manage.py migrate

# 7. Create platform admin
python manage.py create_platform_admin --username admin --email admin@elite.com --password Admin123!

# 8. Run development server
python manage.py runserver
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Django
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=elite_db
DB_USER=elite_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
```

---

## 📁 Project Structure

```
backend/
├── apps/
│   ├── core/              # Base models, mixins, middleware
│   │   ├── models.py      # BaseModel with UUID, timestamps, sync_version
│   │   ├── mixins.py      # TenantViewSetMixin for auto-filtering
│   │   ├── middleware.py  # TenantMiddleware for request tenant
│   │   └── permissions.py # Custom permission classes
│   │
│   ├── tenants/           # Multi-tenant SaaS foundation
│   │   ├── models.py      # Tenant model
│   │   ├── views.py       # Tenant management (Platform Admin only)
│   │   └── serializers.py # Tenant serializers
│   │
│   ├── users/             # Authentication & User Management
│   │   ├── models.py      # Custom User with flexible permissions
│   │   ├── views.py       # Registration, Login, User CRUD
│   │   └── serializers.py # User serializers
│   │
│   ├── branches/          # Branch Management
│   │   ├── models.py      # Branch model (depot, shop, agency, POS)
│   │   └── views.py       # Branch CRUD
│   │
│   ├── catalog/           # Product Catalog
│   │   ├── models.py      # Category, Brand, Unit, Product
│   │   └── views.py       # Catalog CRUD
│   │
│   ├── partners/          # Partners Management
│   │   ├── models.py      # Supplier, Customer
│   │   └── views.py       # Partner CRUD
│   │
│   ├── purchases/         # Purchasing System
│   │   ├── models.py      # PurchaseOrder, PurchaseItem, Reception
│   │   └── views.py       # Purchase CRUD, Status Updates, Reception
│   │
│   ├── inventory/         # Inventory Management
│   │   ├── models.py      # Stock, StockMovement, Transfer, Adjustment, Loss
│   │   └── views.py       # Stock views, Transfers, Adjustments, Losses
│   │
│   ├── sales/             # Sales & Payments
│   │   ├── models.py      # Sale, SaleItem, Invoice, Payment, CashRegister
│   │   └── views.py       # Sales CRUD, Void, Payments, Invoices
│   │
│   ├── expenses/          # Expense Management
│   │   ├── models.py      # ExpenseCategory, Expense
│   │   └── views.py       # Expense CRUD, Approval
│   │
│   ├── reports/           # Reporting & Dashboard
│   │   └── views.py       # Dashboard, Sales Report, Stock Report, etc.
│   │
│   └── sync/              # Offline Sync Engine (USP)
│       ├── models.py      # SyncLog, PendingOperation
│       └── views.py       # Pull, Push, Status endpoints
│
├── config/
│   ├── settings.py        # Django settings
│   ├── urls.py            # Main URL configuration
│   └── wsgi.py            # WSGI configuration
│
├── media/                 # User-uploaded files
├── static/                # Static files
├── .env                   # Environment variables (not in version control)
├── .gitignore             # Git ignore rules
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

---

## 🏗️ Architecture Overview

### Multi-Tenant SaaS Model

```
Platform Super Admin (Us)
    ↓
Tenants (Companies)
    ↓
Company Admin
    ↓
Branches (Depots, Shops, Agencies)
    ↓
Users (Cashiers, Managers, Stock Managers, etc.)
```

### Data Isolation

Every record is scoped to a tenant:

```python
class Product(BaseModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    # ... other fields
```

### Permission System

Flexible, capability-based permissions stored as JSON:

```python
# User model
permissions = models.JSONField(default=list, blank=True)

# Check permission
if user.has_perm('sales_create'):
    # Allow sales creation
```

### Offline Sync Architecture

```
Mobile App (Offline)
    ↓
Local SQLite Database
    ↓
Pending Operations Queue
    ↓
Push Sync (when online)
    ↓
Backend Server
    ↓
Pull Sync (download changes)
```

---

## 🔐 Authentication & Authorization

### JWT Authentication

```bash
# Login
POST /api/auth/login/
{
    "username": "john_doe",
    "password": "SecurePass123!"
}

# Response
{
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "550e8400...",
        "username": "john_doe",
        "tenant_id": "550e8400...",
        "branch_id": "550e8400...",
        "is_tenant_admin": true,
        "permissions": ["sales_create", "stock_view", ...]
    }
}

# Use token
headers: {
    'Authorization': 'Bearer ' + access_token
}
```

### Permission Templates

Pre-defined permission templates for quick user setup:

| Template | Permissions |
|----------|-------------|
| **Cashier** | `sales_create`, `payments_collect`, `stock_view`, `customers_manage` |
| **Stock Manager** | `stock_view`, `stock_adjust`, `transfers_view`, `transfers_create`, `transfers_approve`, `losses_manage`, `purchases_approve` |
| **Accountant** | `sales_view`, `expenses_view`, `reports_view`, `reports_export`, `stock_view`, `purchases_view` |
| **Full Manager** | All capabilities except `users_manage` and `branches_manage` |

### Available Permissions

```javascript
// Administration
'users_manage', 'branches_manage'

// Catalog
'products_manage', 'suppliers_manage', 'customers_manage'

// Purchasing
'purchases_view', 'purchases_create', 'purchases_approve'

// Inventory
'stock_view', 'stock_adjust', 'transfers_view', 'transfers_create', 
'transfers_approve', 'losses_manage'

// Sales & Cash
'sales_view', 'sales_create', 'sales_void', 'payments_collect',
'expenses_create', 'expenses_view'

// Reports
'reports_view', 'reports_export'
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new company |
| POST | `/api/auth/login/` | Login and get JWT token |
| GET | `/api/permissions/templates/` | Get permission templates |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List users (filtered by tenant) |
| POST | `/api/users/` | Create user |
| GET | `/api/users/{id}/` | Get user details |
| PUT | `/api/users/{id}/` | Update user |
| DELETE | `/api/users/{id}/` | Deactivate user |

### Branches

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/branches/` | List branches |
| POST | `/api/branches/` | Create branch |
| GET | `/api/branches/{id}/` | Get branch details |
| PUT | `/api/branches/{id}/` | Update branch |
| DELETE | `/api/branches/{id}/` | Delete branch |

### Catalog

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List categories |
| POST | `/api/categories/` | Create category |
| GET | `/api/brands/` | List brands |
| POST | `/api/brands/` | Create brand |
| GET | `/api/units/` | List units |
| POST | `/api/units/` | Create unit |
| GET | `/api/products/` | List products |
| POST | `/api/products/` | Create product |
| GET | `/api/products/{id}/` | Get product details |
| GET | `/api/products/{id}/stock/` | Get product stock across branches |

### Partners

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers/` | List suppliers |
| POST | `/api/suppliers/` | Create supplier |
| GET | `/api/customers/` | List customers |
| POST | `/api/customers/` | Create customer |

### Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases/` | List purchase orders |
| POST | `/api/purchases/` | Create purchase order |
| GET | `/api/purchases/{id}/` | Get purchase details |
| POST | `/api/purchases/{id}/update-status/` | Update purchase status |
| POST | `/api/purchases/receive/` | Receive goods |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stock/` | List stock levels |
| GET | `/api/stock/movements/` | List stock movements |
| GET | `/api/stock/low-stock/` | List low stock items |
| GET | `/api/transfers/` | List transfers |
| POST | `/api/transfers/` | Create transfer |
| POST | `/api/transfers/{id}/approve/` | Approve transfer |
| POST | `/api/transfers/{id}/dispatch/` | Dispatch transfer |
| POST | `/api/transfers/{id}/receive/` | Receive transfer |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales/` | List sales |
| POST | `/api/sales/` | Create sale |
| GET | `/api/sales/{id}/` | Get sale details |
| POST | `/api/sales/{id}/void/` | Void sale |
| GET | `/api/invoices/` | List invoices |
| POST | `/api/payments/` | Create payment |

### Expenses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses/` | List expenses |
| POST | `/api/expenses/` | Create expense |
| POST | `/api/expenses/{id}/approve/` | Approve expense |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/` | Dashboard summary (7 critical questions) |
| GET | `/api/reports/sales/` | Sales report with filters |
| GET | `/api/reports/stock/` | Stock report |
| GET | `/api/reports/customers/` | Customer report with balances |
| GET | `/api/reports/suppliers/` | Supplier report with payables |
| GET | `/api/reports/profitability/` | Profitability report |

### Sync (Mobile Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync/pull/` | Download changes since last sync |
| POST | `/api/sync/push/` | Upload pending operations |
| GET | `/api/sync/status/` | Get sync status |
| GET | `/api/sync/logs/` | List sync logs |
| GET | `/api/sync/pending/` | List pending operations |

---

## 📊 Dashboard - 7 Critical Questions Answered

The dashboard answers the 7 critical business questions from the project spec:

| Question | Metric |
|----------|--------|
| Where are my products? | Stock summary by branch |
| How much did I buy? | Month purchases total |
| How much did I sell? | Today/Month/Year sales |
| How much do customers owe me? | Customer receivables |
| How much do I owe suppliers? | Supplier payables |
| Which branch performs best? | Branch performance ranking |
| What is my stock value? | Total stock value |

---

## 🔄 Offline Sync (USP)

### How It Works

1. **Pull Sync**: Download all changes since last sync
   - Products, customers, stock, sales, etc.
   - Deleted record IDs for local cleanup

2. **Push Sync**: Upload pending operations
   - Sales created offline
   - Payments collected offline
   - Customers created offline
   - Expenses recorded offline
   - Stock adjustments, transfers, purchases

3. **Idempotency**: Prevent duplicate processing
   - Every operation has a unique `client_mutation_id`
   - Server checks if already processed

4. **Conflict Resolution**: Server wins by default (V1)

### Sync Flow

```
1. Mobile app detects network
2. Pull sync: Download latest data
3. Push sync: Upload pending operations
4. Update local database
5. Store new sync timestamp
```

---

## 🛠️ Development Commands

```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create migrations for specific app
python manage.py makemigrations sales

# Run server
python manage.py runserver

# Create platform admin
python manage.py create_platform_admin --username admin --email admin@elite.com --password Admin123!

# Check expired subscriptions
python manage.py check_expired_subscriptions

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic

# Generate API schema
python manage.py spectacular --file schema.yml
```

---

## 🐳 Docker Support

### Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: elite_db
      POSTGRES_USER: elite_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DB_NAME: elite_db
      DB_USER: elite_user
      DB_PASSWORD: secure_password
      DB_HOST: db
      DB_PORT: 5432

volumes:
  postgres_data:
```

---

## 📝 API Documentation

- **Swagger UI**: `http://localhost:8000/swagger/`
- **ReDoc**: `http://localhost:8000/redoc/`
- **Schema JSON**: `http://localhost:8000/api/schema/`

---

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run tests for specific app
python manage.py test apps.sales

# Run tests with coverage
pip install coverage
coverage run manage.py test
coverage report
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Use strong `SECRET_KEY`
- [ ] Configure PostgreSQL with secure password
- [ ] Set up SSL/TLS
- [ ] Configure CORS for your frontend domains
- [ ] Set up logging
- [ ] Configure email settings
- [ ] Run migrations on deployment
- [ ] Collect static files
- [ ] Set up background tasks (Celery if needed)

### Deployment Steps

```bash
# 1. Update .env for production
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com

# 2. Run migrations
python manage.py migrate

# 3. Collect static files
python manage.py collectstatic

# 4. Run with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000

# 5. Use Nginx as reverse proxy (recommended)
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'pkg_resources'` | `pip install --upgrade setuptools wheel` |
| `AlreadyRegistered: The model Branch is already registered` | Remove duplicate admin registration |
| `Application labels aren't unique, duplicates: inventory` | Check for duplicate app names in INSTALLED_APPS |
| `Cannot import name 'CashRegister' from 'apps.inventory.models'` | Import from `apps.sales.models` instead |

### Logs

```bash
# View logs
tail -f logs/debug.log

# Django error logs
python manage.py runserver --verbosity 3
```

---

## 📚 Additional Documentation

- [Project Specification](docs/project-spec.md)
- [API Reference](docs/api-reference.md)
- [Database Schema](docs/database-schema.md)
- [Offline Sync Guide](docs/offline-sync.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This is proprietary software. All rights reserved.

---

## 📧 Contact

- **Support**: support@elite.com
- **Documentation**: https://docs.elite.com
- **API Status**: https://status.elite.com

---

## 🎯 Roadmap

### Version 1 (Current) ✅
- Multi-tenant SaaS foundation
- User management with flexible permissions
- Catalog management
- Purchasing system
- Inventory management
- Sales & payments
- Expenses management
- Reports & dashboard
- Offline sync engine (USP)

### Version 2 (Planned)
- Full OHADA accounting module
- General ledger
- Trial balance
- Income statement
- Balance sheet
- Multi-currency accounting

### Version 3 (Planned)
- WhatsApp AI Assistant (Nuru)
- Natural language processing
- Voice commands
- Automated reporting via chat

---

## ⚡ Performance Tips

1. **Database Indexing**: All models have indexes on `tenant`, `branch`, `updated_at`
2. **Query Optimization**: Use `select_related` and `prefetch_related`
3. **Pagination**: All list endpoints are paginated (50 per page)
4. **Caching**: Use Redis for frequently accessed data
5. **Background Tasks**: Use Celery for heavy operations

---

**Built with ❤️ for businesses in challenging environments**