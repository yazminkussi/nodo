-- ============================================================
-- NODO · Seed de demostración (Fase 1)
-- Carga la comunidad "La Unión" + 12 socios de ejemplo y te asigna
-- el rol superadmin.
--
-- ANTES DE CORRER: cambiá el email de la línea `v_email` por el
-- correo con el que te registrás en la app.
--
-- Si todavía no te registraste, el bloque igual carga la comunidad
-- y los socios; volvé a correrlo después de registrarte para que
-- te asigne el rol superadmin.
-- ============================================================

do $$
declare
  v_email  text := 'kussiyazumai@gmail.com';   -- <<< CAMBIAR
  v_perfil uuid;
begin
  -- comunidad demo -------------------------------------------------
  insert into public.comunidades
    (id, nombre, institucion, tipo, direccion, ciudad, barrio, cuit, telefono, email, plan)
  values
    ('la-union', 'Club Social y Deportivo La Unión', 'Centro Cultural y Deportivo',
     'Club Social y Deportivo', 'Av. Rivadavia 3456, Villa Crespo', 'Ciudad de Buenos Aires',
     'Villa Crespo', '30-70998877-4', '11 4824-3000', 'contacto@clubunion.com.ar', 'Plan 250 Socios')
  on conflict (id) do nothing;

  -- socios demo --------------------------------------------------
  insert into public.socios
    (comunidad_id, numero, nombre, apellido, dni, email, celular, categoria, cuota_al_dia, ultima_cuota, cuota_monto, localidad, color)
  values
    ('la-union','0001','Carlos','Kussi','14123456','carlos.kussi@clubunion.com.ar','54 9 11 5555-1201','Honorario',true ,'2026-07-01',18000,'Villa Crespo','#0F172A'),
    ('la-union','0142','Julieta','Méndez','33987654','julieta.mendez@gmail.com','54 9 11 5555-9802','Activo',true ,'2026-07-15',18000,'Caballito','#0D9488'),
    ('la-union','0087','Roberto','Fernández','12590011','roberto.fernandez@gmail.com','54 9 11 5555-3340','Honorario',true ,'2026-07-05',15000,'Almagro','#334155'),
    ('la-union','0231','Mariana','López','34567890','mariana.lopez@hotmail.com','54 9 11 5555-7715','Activo',true ,'2026-07-12',18000,'Villa Crespo','#059669'),
    ('la-union','0198','Diego','Correa','33774155','diego.correa@gmail.com','54 9 11 5555-4488','Activo',false,'2026-04-12',18000,'Flores','#F59E0B'),
    ('la-union','0315','Sofía','Almeida','40222888','sofi.almeida@icloud.com','54 9 11 5555-6203','Juvenil',true ,'2026-07-18',12000,'Boedo','#06B6D4'),
    ('la-union','0110','Jorge','Paredes','31555999','jorge.paredes@yahoo.com.ar','54 9 11 5555-8890','Activo',false,'2026-03-20',18000,'Caballito','#EF4444'),
    ('la-union','0276','Lucía','Benítez','35774123','lucia.benitez@gmail.com','54 9 11 5555-2019','Activo',true ,'2026-07-10',18000,'Palermo','#7C3AED'),
    ('la-union','0044','Martín','Ocampo','26111222','martin.ocampo@gmail.com','54 9 11 5555-7764','Adherente',false,'2026-05-02',14000,'Villa Crespo','#F97316'),
    ('la-union','0342','Carla','Ruiz','40999333','carla.ruiz@gmail.com','54 9 11 5555-1102','Juvenil',true ,'2026-07-21',12000,'Chacarita','#EC4899'),
    ('la-union','0009','Antonio','Sosa','18060777','antonio.sosa@gmail.com','54 9 11 5555-0954','Honorario',true ,'2026-07-01',0    ,'Villa Crespo','#64748B'),
    ('la-union','0258','Nadia','Quiroga','38999877','nadia.quiroga@gmail.com','54 9 11 5555-3155','Activo',false,'2026-05-30',18000,'Villa Luro','#0EA5E9')
  on conflict (comunidad_id, numero) do nothing;

  -- rol superadmin para tu usuario -----------------------------
  select id into v_perfil from public.perfiles where email = v_email;

  if v_perfil is not null then
    insert into public.membresias (perfil_id, comunidad_id, rol)
    values (v_perfil, 'la-union', 'superadmin')
    on conflict (perfil_id, comunidad_id)
      do update set rol = 'superadmin', estado = 'activa';
    raise notice 'OK: % es superadmin de la-union', v_email;
  else
    raise notice 'Sin perfil para %. Registrate en la app y volvé a correr este bloque.', v_email;
  end if;
end $$;
