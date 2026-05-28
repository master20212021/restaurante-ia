-- =============================================
-- RESTAURANTE-IA: Schema inicial
-- =============================================

-- Tabla de restaurantes (clientes del SaaS)
CREATE TABLE IF NOT EXISTS restaurantes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  telefono      TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT,
  google_sheet_id  TEXT,
  horario_apertura TIME NOT NULL DEFAULT '09:00',
  horario_cierre   TIME NOT NULL DEFAULT '22:00',
  activo        BOOLEAN NOT NULL DEFAULT true,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de clientes del restaurante (CRM)
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id  UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  telefono        TEXT NOT NULL,
  nombre          TEXT,
  total_pedidos   INTEGER NOT NULL DEFAULT 0,
  ultimo_pedido   TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(restaurante_id, telefono)
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id              UUID NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  cliente_telefono            TEXT NOT NULL,
  cliente_nombre              TEXT,
  items                       JSONB NOT NULL DEFAULT '[]',
  total_estimado              NUMERIC(10,2) NOT NULL DEFAULT 0,
  tipo                        TEXT NOT NULL DEFAULT 'pickup' CHECK (tipo IN ('pickup','delivery','mesa')),
  estado                      TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','confirmado','en_preparacion','listo','entregado','cancelado')),
  direccion_entrega           TEXT,
  notas                       TEXT,
  transcripcion               TEXT,
  duracion_llamada_segundos   INTEGER,
  creado_en                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_pedidos_restaurante_fecha ON pedidos(restaurante_id, creado_en DESC);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_clientes_restaurante ON clientes(restaurante_id, telefono);

-- Trigger: actualizar actualizado_en automáticamente
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pedidos_actualizado_en
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Restaurante de demo (empresa ficticia) — UUID fijo para referencia en código
INSERT INTO restaurantes (id, nombre, telefono, horario_apertura, horario_cierre)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'La Taquería del Norte',
  '+525500000000',
  '09:00',
  '23:00'
) ON CONFLICT DO NOTHING;

-- Pedidos de ejemplo para ver el dashboard funcionando
INSERT INTO pedidos (restaurante_id, cliente_telefono, cliente_nombre, items, total_estimado, tipo, estado)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+525511111111', 'Juan Hernández',
   '[{"nombre":"Taco de bistec","cantidad":3,"precio_unitario":25},{"nombre":"Agua fresca","cantidad":1,"precio_unitario":20}]',
   95, 'pickup', 'pendiente'),
  ('00000000-0000-0000-0000-000000000001', '+525522222222', 'María López',
   '[{"nombre":"Orden de quesadillas","cantidad":2,"precio_unitario":45,"notas":"sin cebolla"},{"nombre":"Coca-Cola","cantidad":2,"precio_unitario":20}]',
   130, 'delivery', 'confirmado'),
  ('00000000-0000-0000-0000-000000000001', '+525533333333', 'Carlos Ruiz',
   '[{"nombre":"Taco de carnitas","cantidad":4,"precio_unitario":28}]',
   112, 'pickup', 'en_preparacion');
