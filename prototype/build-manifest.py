"""Rebuild the local hotspot manifest from the exported canvas geometry."""
import json
from pathlib import Path
nodes=json.loads(Path(__file__).with_name('canvas-nodes.json').read_text())
sections={
 'Cliente · escritorio':['aiuVt','GcHvf','CTwi6','QRWqF','mLRAY'],
 'Cliente · móvil':['KKxdU','p45ipV','M2vgQT','BVUFI','a4Tzo','EFCOW'],
 'Comerciante':['T28VaZ','BnjUF','SWso9','bpqzW','h91to','OrB9k','D2zhK','Mgewd','X0uXg','pSIRS','TtKVe','y15ABx','kQgTm'],
 'Alternativas':['vHDrB','j6xDkI','defJ5'],
 'Soporte y referencia':['U3vDvD','euR0h','o8vGp','r2JYH','Ijo5S','spnbx','Vo4aC','mplP7','DVSNA']}
screens={n['id']:{'id':n['id'],'name':n['name'],'width':n['w'],'height':n['h'],'image':'screens/'+n['id']+'.png','hotspots':[]} for n in nodes if n['depth']==0 and n['id'] in {id for ids in sections.values() for id in ids}}
screens['DVSNA']['height']=1100
for section,ids in sections.items():
 for id in ids:screens[id]['section']=section

def add(id,label,action,target=None,box=None,name=None,text=None,index=-1):
 if box is None:
  matches=[n for n in nodes if n['root']==id and (name is None or n['name']==name) and (text is None or n.get('content')==text)]
  if not matches:raise ValueError((id,label,name,text))
  n=matches[index]; w=max(44,n['w']+24);h=max(44,n['h']+20)
  box=[max(0,n['x']-(w-n['w'])/2),max(0,n['y']-(h-n['h'])/2),w,h]
 s=screens[id]; x,y,w,h=box
 s['hotspots'].append({'label':label,'action':action,'target':target,'x':x,'y':y,'width':min(w,s['width']-x),'height':min(h,s['height']-y)})
for id,mobile in [('aiuVt',False),('KKxdU',True)]:
 add(id,'Buscar jitomate en el mercado','search',box=[400,110,630,60] if not mobile else [20,145,350,50])
 add(id,'Ver Mercado Medellín','route','p45ipV' if mobile else 'GcHvf',text='Mercado Medellín',index=0)
 add(id,'Ver productos de Doña Lucha','catalog','M2vgQT' if mobile else 'CTwi6',text='Doña Lucha',index=-1 if not mobile else 1)
 add(id,'Entrar como comerciante','route','T28VaZ',text='Soy comerciante')
 add(id,'Entrar como cliente','route','KKxdU' if mobile else 'aiuVt',text='Soy cliente')
 add(id,'Iniciar sesión de demostración','login',text='Iniciar sesión')
for id,mobile in [('GcHvf',False),('vHDrB',False),('p45ipV',True),('j6xDkI',True)]:
 add(id,'Volver al mapa','route','KKxdU' if mobile else 'aiuVt',text='Mapa' if mobile else 'Volver al mapa')
 add(id,'Ver cuadrícula','route','p45ipV' if mobile else 'GcHvf',text='Cuadrícula')
 add(id,'Ver lista','route','j6xDkI' if mobile else 'vHDrB',text='Lista')
 add(id,'Buscar productos','search',name='Current product query')
 add(id,'Ver productos de Doña Lucha','catalog','M2vgQT' if mobile else 'CTwi6',text='Ver productos',index=0)
 add(id,'Ver productos de El huerto de Pepe','pepe',text='Ver productos',index=1)
 add(id,'Abrir carrito','cart',text='Ver carrito · 3' if mobile else 'Ver carrito')
 add(id,'Abrir carrito desde cabecera','cart',box=[330,8,50,44] if mobile else [1260,18,132,46])
 add(id,'Plano disponible próximamente','notice','El plano del mercado aún no está disponible.',text='Plano\nPronto' if mobile else 'Plano (pronto)')
 if not mobile:add(id,'Iniciar sesión de demostración','login',text='Iniciar sesión')
for id,mobile in [('CTwi6',False),('M2vgQT',True)]:
 add(id,'Cerrar catálogo','close',name='Close overlay icon')
 add(id,'Revisar apartado','review','a4Tzo' if mobile else 'QRWqF',text='Revisar apartado')
 for n in nodes:
  if n['root']==id and n['type']=='icon' and n.get('icon') in ['plus','minus']:
   product=next((i for i,p in enumerate(['Jitomate saladet','Aguacate Hass','Cilantro fresco']) if n['name'].startswith(p)),None)
   if product is not None:add(id,('Aumentar ' if n['icon']=='plus' else 'Reducir ')+['jitomate','aguacate','cilantro'][product],'quantity',str(product)+('+' if n['icon']=='plus' else '-'),name=n['name'])
 add(id,'Buscar en el catálogo','notice','Este escenario incluye jitomate, aguacate y cilantro.',name='Merchant catalog search icon')
for id,mobile in [('QRWqF',False),('a4Tzo',True)]:
 add(id,'Volver al catálogo','catalog','M2vgQT' if mobile else 'CTwi6',name='Back to merchant catalog icon')
 add(id,'Cerrar revisión','close',name='Close overlay icon')
 add(id,'Solicitar apartado','submit','EFCOW' if mobile else 'mLRAY',text='Solicitar apartado')
 add(id,'Elegir horario de recogida','pickup',text='Hoy · 12:30–13:00')
 add(id,'Editar quién recoge','contact',name='Pickup customer name')
for id,mobile in [('EFCOW',True),('mLRAY',False)]:
 add(id,'Cerrar solicitud enviada','close',name='Close overlay icon')
 add(id,'Volver al mercado','market',text='Volver al mercado')
 add(id,'Ver mi apartado','reservation',text='Ver mi apartado')
add('BVUFI','Volver al mercado','market',text='Volver al mercado')
add('BVUFI','Seguir buscando productos','market',text='Seguir buscando productos')
add('BVUFI','Revisar apartado','review','a4Tzo',text='Revisar apartado')
for n in nodes:
 if n['root']=='BVUFI' and n['type']=='icon' and n.get('icon') in ['plus','minus','trash-2']:
  y=n['y'];p=0 if y<440 else 1 if y<590 else 2
  add('BVUFI',('Eliminar ' if n['icon']=='trash-2' else 'Aumentar ' if n['icon']=='plus' else 'Reducir ')+['jitomate','aguacate','cilantro'][p],'quantity',str(p)+('0' if n['icon']=='trash-2' else '+' if n['icon']=='plus' else '-'),box=[n['x']-12,n['y']-12,44,44])
nav={'Resumen':'T28VaZ','Productos':'BnjUF','Pedidos':'SWso9','Finanzas':'bpqzW','Mi puesto':'h91to'}
for id in ['T28VaZ','BnjUF','SWso9','bpqzW','h91to','D2zhK','Mgewd','X0uXg']:
 for text,target in nav.items():add(id,'Ir a '+text.lower(),'route',target,text=text,index=0)
 if id in ['T28VaZ','BnjUF','SWso9','bpqzW','h91to']:add(id,'Ver puesto público','catalog','CTwi6',text='Ver mi puesto')
 add(id,'Consultar ayuda','route','Ijo5S',text='Necesito ayuda')
add('T28VaZ','Editar formas de pago','route','h91to',text='Formas de pago que aceptas →')
add('T28VaZ','Revisar pedidos','route','SWso9',text='Revisar pedidos')
add('T28VaZ','Ver todos los pedidos','route','SWso9',text='Ver todos')
add('T28VaZ','Ver pedido 041','route','SWso9',text='#041')
add('T28VaZ','Registrar venta de demostración','sale',text='Registrar venta')
add('BnjUF','Guardar cambios de producto','notice','Cambios simulados. El inventario real no se modifica.',text='Guardar cambios')
add('BnjUF','Agregar producto de demostración','notice','Alta de productos fuera del recorrido interactivo. Puedes revisar precio y existencias en esta pantalla.',text='Agregar producto')
add('BnjUF','Cancelar edición','route','T28VaZ',text='Cancelar')
add('SWso9','Aceptar pedido y preparar','route','OrB9k',text='Aceptar pedido')
add('SWso9','Proponer cambio','route','Ijo5S',text='Proponer cambio')
add('SWso9','No puedo atenderlo','notice','Cancelación simulada. No se ha enviado ningún aviso.',text='No puedo atenderlo')
add('bpqzW','Guardar gasto de demostración','expense',text='Guardar gasto')
add('bpqzW','Descargar registro de demostración','download',text='Descargar registro')
add('h91to','Guardar puesto de demostración','notice','Información guardada solo como demostración; no se publica.',text='Guardar y actualizar puesto')
for text,target in [('Resumen','T28VaZ'),('Pedidos','SWso9'),('Productos','BnjUF'),('Más','h91to')]:add('OrB9k','Ir a '+text.lower(),'route',target,text=text)
add('OrB9k','Marcar pedido como listo','ready',text='Marcar como listo')
for text,target in [('Explorar','KKxdU'),('Pedidos','EFCOW'),('Favoritos','defJ5')]:add('defJ5','Ir a '+text.lower(),'route',target,text=text)
add('defJ5','Ver productos favoritos','catalog','M2vgQT',text='Ver productos')
for id,mob in [('D2zhK',False),('TtKVe',True)]:
 add(id,'Volver al resumen','route','pSIRS' if mob else 'T28VaZ',text='Resumen' if mob else 'Volver al resumen',index=-1 if mob else 0)
 add(id,'Revisar nuevo precio','price-review','y15ABx' if mob else 'Mgewd',text='Revisar nuevo precio')
 add(id,'Conservar precio actual','price-cancel','pSIRS' if mob else 'T28VaZ',text='Conservar $32.00 / kg' if mob else 'Conservar $32 / kg')
for id,mob in [('Mgewd',False),('y15ABx',True)]:
 add(id,'Volver a comparar precios','route','TtKVe' if mob else 'D2zhK',text='Comparar precios' if mob else 'Volver a comparar')
 add(id,'Editar nuevo precio','price-edit',name='Nuevo precio móvil valor' if mob else 'Nuevo precio valor')
 add(id,'Guardar nuevo precio','price-save','kQgTm' if mob else 'X0uXg',text='Guardar $30.00 / kg')
 add(id,'Cancelar cambio de precio','price-cancel','TtKVe' if mob else 'D2zhK',text='Cancelar')
for id,mob in [('kQgTm',True),('X0uXg',False)]:add(id,'Volver al resumen','route','pSIRS' if mob else 'T28VaZ',text='Volver al resumen')
add('pSIRS','Comparar precios del giro','route','TtKVe',text='Comparar precios')
add('pSIRS','Registrar venta de demostración','sale',text='Registrar venta')
add('pSIRS','Editar formas de pago','route','h91to',text='Formas de pago que aceptas →')
add('pSIRS','Revisar pedidos pendientes','route','SWso9',text='3 pedidos por confirmar')
add('pSIRS','Revisar stock de cilantro','route','BnjUF',text='Cilantro: quedan 3 manojos')
for text,target in [('Resumen','pSIRS'),('Pedidos','SWso9'),('Productos','BnjUF'),('Mi puesto','h91to')]:add('pSIRS','Ir a '+text.lower(),'route',target,text=text)
if any(n['root']=='T28VaZ' and n.get('content')=='Comparar precios' for n in nodes):add('T28VaZ','Comparar precios del giro','route','D2zhK',text='Comparar precios')
for i,target in enumerate(['aiuVt','KKxdU','T28VaZ','vHDrB','Ijo5S']):add('DVSNA','Abrir recorrido '+str(i+1),'route',target,box=[80,205+i*132,1260,90])
data={'sections':sections,'screens':screens}
Path(__file__).with_name('manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
Path(__file__).with_name('data.js').write_text('window.PROTOTYPE_DATA='+json.dumps({'manifest':data,'nodes':nodes},ensure_ascii=False)+';\n')
print(len(screens),'screens;',sum(len(s['hotspots']) for s in screens.values()),'hotspots')
