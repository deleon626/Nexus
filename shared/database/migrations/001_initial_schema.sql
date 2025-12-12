-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QC Schemas
CREATE TABLE schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    definition JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, version)
);

-- Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id UUID REFERENCES schemas(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active',
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id UUID REFERENCES schemas(id),
    schema_version VARCHAR(50),
    session_id UUID REFERENCES sessions(id),
    data JSONB NOT NULL,
    attachments TEXT[],
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id),
    action VARCHAR(50) NOT NULL,
    actioned_by UUID REFERENCES users(id),
    actioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT
);

-- Events (audit log)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    session_id UUID REFERENCES sessions(id),
    payload JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_approvals_report_id ON approvals(report_id);
