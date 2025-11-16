import React, { useState } from 'react';
import { Shuffle, Gift, Users, AlertCircle, Sparkles, Ban } from 'lucide-react';

const BogoBogoAmigoInvisible = () => {
  const [people, setPeople] = useState([
    {id: 1,   name: "Antonio",    email: "antonioperearocamora@gmail.com",  excludedIds: [8, 10]},
    {id: 2,   name: "Dani",       email: "blasteroid007@gmail.com",         excludedIds: [11, 3]},
    {id: 3,   name: "Eric",       email: "ericmasbelen2003@gmail.com",      excludedIds: [6, 2]},
    {id: 4,   name: "Estela",     email: "estelasempere.es@gmail.com",      excludedIds: [9]},
    {id: 5,   name: "Iker",       email: "ikerpastor03@gmail.com",          excludedIds: []},
    {id: 6,   name: "Jairo",      email: "jairomadrigalcutillas@gmail.com", excludedIds: [4, 1]},
    {id: 7,   name: "Meritxell",  email: "txellpolocandela@gmail.com",      excludedIds: []},
    {id: 8,   name: "Mónica",     email: "mariaamareotoo@gmail.com",        excludedIds: [10]},
    {id: 9,   name: "Nur",        email: "nurdelamo2003@gmail.com",         excludedIds: [6, 2]},
    {id: 10,  name: "Marcos",     email: "marcos.alemany.m@gmail.com",      excludedIds: [8, 11]},
    {id: 11,  name: "Izan",       email: "iganru03@gmail.com",              excludedIds: [3, 5]},
  ]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [sorting, setSorting] = useState(false);
  const [iterations, setIterations] = useState(0);
  const [error, setError] = useState('');
  const [editingExclusions, setEditingExclusions] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const shuffle = (arr) => {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const addPerson = () => {
    if (!newName.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!newEmail.trim()) {
      setError('El email es requerido');
      return;
    }
    
    const newId = people.length > 0 ? Math.max(...people.map(p => p.id)) + 1 : 1;
    setPeople([...people, { id: newId, name: newName.trim(), email: newEmail.trim(), excludedIds: [] }]);
    setNewName('');
    setNewEmail('');
    setError('');
  };

  const removePerson = (id) => {
    setPeople(people.filter(p => p.id !== id));
  };

  const toggleExclusion = (personId, excludedId) => {
    setPeople(people.map(p => {
      if (p.id === personId) {
        const newExcluded = p.excludedIds.includes(excludedId)
          ? p.excludedIds.filter(id => id !== excludedId)
          : [...p.excludedIds, excludedId];
        return { ...p, excludedIds: newExcluded };
      }
      return p;
    }));
  };

  const generateAssignments = async () => {
    setError('');
    setIterations(0);
    setSendStatus(null);
    
    try {
      if (people.length < 2) {
        setError('Necesitas al menos 2 personas');
        return;
      }

      setSorting(true);
      
      const ids = people.map(p => p.id);
      let validAssignment = false;
      let result = [];
      let iterCount = 0;
      const maxAttempts = 1000;
      
      while (!validAssignment && iterCount < maxAttempts) {
        iterCount++;
        setIterations(iterCount);
        
        const shuffled = shuffle(ids);
        result = [];
        let isValid = true;
        
        for (let i = 0; i < shuffled.length; i++) {
          const giverId = shuffled[i];
          const receiverId = shuffled[(i + 1) % shuffled.length];
          const giver = people.find(p => p.id === giverId);
          
          if (giver.excludedIds.includes(receiverId)) {
            isValid = false;
            break;
          }
          
          const receiver = people.find(p => p.id === receiverId);
          result.push({
            giver: giver.name,
            giverEmail: giver.email,
            receiver: receiver.name,
            receiverEmail: receiver.email
          });
        }
        
        if (isValid) {
          validAssignment = true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      if (!validAssignment) {
        setError('No se pudo encontrar una asignación válida con las exclusiones actuales. Intenta reducir las restricciones.');
        setSorting(false);
        return;
      }
      
      setAssignments(result);
      setSorting(false);
    } catch (e) {
      setError('Error: ' + e.message);
      setSorting(false);
    }
  };

  const sendEmailsToBackend = async () => {
    if (assignments.length === 0) {
      setError('Primero debes generar las asignaciones');
      return;
    }

    setSending(true);
    setSendStatus(null);
    setError('');

    try {
      const response = await fetch('/api/send-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments })
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus({
          type: 'success',
          message: `✅ Emails enviados correctamente: ${data.successful} exitosos, ${data.failed} fallidos`,
          details: data
        });
        setShowResults(false);
      } else {
        setSendStatus({
          type: 'error',
          message: `❌ Error: ${data.error}`,
        });
      }
    } catch (e) {
      setSendStatus({
        type: 'error',
        message: `❌ Error de conexión: ${e.message}. ¿Está el servidor ejecutándose?`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gift className="w-10 h-10 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-800">
              Amigo Invisible BogoBogoSort
            </h1>
            <Sparkles className="w-10 h-10 text-pink-600" />
          </div>
          <p className="text-gray-600">
            El algoritmo más caótico para asignar amigos invisibles
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Participantes ({people.length})
          </h2>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPerson()}
              placeholder="Nombre"
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                placeholder="Email"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={addPerson}
                className="bg-purple-600 text-white px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Añadir
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2 mb-4">
            {people.map((person) => (
              <div
                key={person.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{person.name}</p>
                    <p className="text-sm text-gray-600">{person.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingExclusions(editingExclusions === person.id ? null : person.id)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      {editingExclusions === person.id ? 'Cerrar' : 'Exclusiones'}
                    </button>
                    <button
                      onClick={() => removePerson(person.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {editingExclusions === person.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      No puede regalar a:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {people.filter(p => p.id !== person.id).map(otherPerson => (
                        <button
                          key={otherPerson.id}
                          onClick={() => toggleExclusion(person.id, otherPerson.id)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            person.excludedIds.includes(otherPerson.id)
                              ? 'bg-red-100 text-red-700 border-2 border-red-300'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {otherPerson.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={generateAssignments}
            disabled={sorting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sorting ? (
              <>
                <Shuffle className="w-5 h-5 animate-spin" />
                Aplicando caos... ({iterations} iteraciones)
              </>
            ) : (
              <>
                <Shuffle className="w-5 h-5" />
                Generar Asignaciones
              </>
            )}
          </button>

          {assignments.length > 0 && (
            <div className="mt-4 space-y-3">
              <button
                onClick={sendEmailsToBackend}
                disabled={sending}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>⏳ Enviando emails...</>
                ) : (
                  <>📧 Enviar Emails a Todos (sin mostrar resultados)</>
                )}
              </button>

              <button
                onClick={() => setShowResults(!showResults)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {showResults ? '🙈 Ocultar Resultados' : '👁️ Ver Resultados (¡Spoiler!)'}
              </button>
            </div>
          )}

          {sendStatus && (
            <div className={`mt-4 p-4 rounded-lg ${
              sendStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                sendStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {sendStatus.message}
              </p>
            </div>
          )}
        </div>

        {assignments.length > 0 && showResults && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gift className="w-6 h-6 text-purple-600" />
              Asignaciones Generadas (¡Spoiler Alert! 👀)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Se realizaron {iterations} iteraciones de BogoBogoSort
            </p>
            
            <div className="space-y-3">
              {assignments.map((assignment, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {assignment.giver}
                      </p>
                      <p className="text-sm text-gray-600">
                        {assignment.giverEmail}
                      </p>
                    </div>
                    <div className="text-2xl text-purple-600">→</div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        {assignment.receiver}
                      </p>
                      <p className="text-sm text-gray-600">
                        {assignment.receiverEmail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>💡 Nota:</strong> Cada vez que generes las asignaciones obtendrás 
                un resultado completamente diferente gracias al caos de BogoBogoSort. 
                ¡Es perfectamente impredecible!
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              🎯 ¿Cómo funciona esta web?
            </h3>
            <p className="text-sm text-gray-600">
              <strong>Amigo Invisible BogoBogoSort</strong> es una aplicación web que utiliza uno de los algoritmos de ordenamiento más caóticos e ineficientes jamás creados para generar asignaciones completamente aleatorias de amigo invisible. Simplemente añade participantes con su nombre y email, configura las exclusiones (personas que no pueden regalarse entre sí, como parejas o hermanos), y pulsa el botón para iniciar el caos. El algoritmo mezcla aleatoriamente los IDs de todos los participantes hasta encontrar un "círculo cerrado" válido donde cada persona regala a exactamente una persona y recibe de otra, respetando todas las restricciones configuradas. Gracias a la naturaleza impredecible de BogoBogoSort, cada ejecución produce resultados completamente diferentes, y el contador de iteraciones muestra cuántos intentos aleatorios necesitó hasta encontrar una combinación válida.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              🔄 ¿Cómo se escoge quién regala a quién?
            </h3>
            <p className="text-sm text-gray-600">
              El algoritmo genera un <strong>círculo cerrado</strong> donde cada persona regala a exactamente una persona y recibe de otra. Funciona así: primero mezcla aleatoriamente todos los IDs de los participantes (esto es el "shuffle" tipo BogoSort), luego intenta formar una cadena circular conectando cada persona con la siguiente en esa lista mezclada. Por ejemplo, si después de mezclar queda [Ana, Luis, María, Carlos], entonces Ana regala a Luis, Luis a María, María a Carlos, y Carlos cierra el círculo regalando a Ana.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Sin embargo, si alguna de estas asignaciones viola una exclusión configurada (por ejemplo, si Ana tiene a Luis en su lista de exclusiones), el algoritmo descarta esa combinación completa y vuelve a mezclar los IDs desde cero. Este proceso se repite una y otra vez hasta encontrar un círculo donde <strong>todas</strong> las asignaciones sean válidas y respeten las restricciones. El contador de iteraciones muestra cuántos intentos aleatorios fueron necesarios hasta dar con una combinación perfecta.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              🤯 ¿Qué es BogoBogoSort?
            </h3>
            <p className="text-sm text-gray-600">
              Es uno de los algoritmos de ordenamiento más ineficientes jamás creados. Para ordenar una lista, intenta ordenar recursivamente todas las sublistas usando BogoSort (que simplemente mezcla aleatoriamente hasta que esté ordenado). Tiene una complejidad temporal de O(n!) en el mejor caso... ¡y muchísimo peor en promedio! Aquí lo usamos para mezclar IDs aleatoriamente hasta encontrar un círculo válido. Es como tirar dados hasta que salga exactamente lo que necesitas, pero con nombres en lugar de números. ¡Puro caos matemático al servicio de tu amigo invisible!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BogoBogoAmigoInvisible;