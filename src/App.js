import React, { useState, useEffect } from 'react';
import './App.css';
import { API,Storage } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import '@aws-amplify/ui-react/styles.css';
import { Button } from '@aws-amplify/ui-react';


const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }
  const signOut = ()=>{
    window.localStorage.clear();
    window.location.reload();
  }
  return (
    <div className="App">
      <h1>AWS Demo - Public Blackboard</h1>
      <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
        style={{
          height:"45px",
          width:"180px",
          marginRight:"10px",
          borderRadius:"5px",
          border:"1px solid grey"
        }}
      />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
        style={{
          height:"45px",
          width:"180px",
          marginRight:"10px",
          borderRadius:"5px",
          border:"1px solid grey"
        }}
      />
      <input
        type="file"
        onChange={onChange}
      />
      <Button style={{border:"2px solid grey",margin:"10px"}} onClick={createNote}>Create Note</Button>
      <Button style={{border:"2px solid grey"}} onClick={signOut}>Sign Out</Button>
      <div className='itemContainer' style={{marginBottom: 30}}>
      {
        notes.map(note => (
          <div className='item' key={note.id || note.name}>
            <p style={{textDecoration:"bold"}}>{note.name}</p>
            <p>{note.description}</p>
            {
              note.image && <img src={note.image} alt='' style={{width: "200px", height: "200px", objectFit:"contain"}} />
            }
            <Button style={{border:"2px solid grey"}} onClick={() => deleteNote(note)}>Delete note</Button>
          </div>
        ))
      }
      </div>
    </div>
  );
}

export default withAuthenticator(App);