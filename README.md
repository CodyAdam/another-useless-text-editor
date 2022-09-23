# OMD-TP2

# I. Introduction
Présentation du (projet/sujet)
Présentation de la méthodologie
Présentation de l'implémentation

# II. Déroulement

Comme pour le TP1, nous cherchons à nous approprier le sujet en faisant un cahier des charges plus lisible et plus adapté à la situation.
Cahier des
## Cahier des charges: 

### V1

- Le texte est contenu dans un buffer (zone de travail)
- Il  existe  une  notion  de  sélection  de  texte,  avec  des  commandes  utilisateur  permettant  de déplacer le début et la fin de la sélection
- Copie de la sélection dans le presse-papier
- Copie de la sélection dans le presse-papier puis effacement de la sélection
- Remplacement (« collage ») de la sélection par le contenu du presse-papier
- L'interface homme-machine est d'un type quelconque (textuelle ou graphique)

### V2

- D'enregistrer/rejouer les actions de l'utilisateur (e.g., script) 
- De réaliser le défaire/refaire, avec une capacité quelconque dans le défaire 
(autrement dit on peut revenir au début)

## Plan
çons ensuite par définir les différents graphoque UML nécessaires avant de commencer l'implémentation :
- Diagramme de classe
- Diagramme séquence
- Diagramme d'état

## II.1 Diagramme de classe

Puis nous nous lançons dans le diagramme de classe :

```plantuml
@startuml
skinparam classAttributeIconSize 0
    class Editor {
        -content: List<String>
        +Editor(): Editor
        +deletBetween(start: Position, end: Position): void
        +deleteBefore(pos: Position): void
        +deleteAfter(pos: Position): void
        +addStringBetween(text: String, start: Position, end: Position): void
        +getStringBetween(start: Position, end: Position): String
    }

    class Application{
        -editor: Editor
        -clipboard: String
        -cursor: Cursor
        +Application(): Application
        +onCopy(): void
        +onPaste(): void
        +onWrite(text: String): void
        +onDelete(): void
        +onStartSelectt(pos: Position): void
        +onEndSelectt(pos: Position): void
        +onMoveCursor(pos: Position): void
        +getCursor(): Cursor
        +getClipboard(): String
        +getEditor(): Editor
        -render(): void
    }

    Abstract Command{
        +Command(): Command
        +execute(): void
        +getName(): String
    }
    
    class Cursor{
        -start: Position
        -end: Position
        +Cursor(): Cursor
        +isSelection()
        +getSelectionSize()
        +getStart()
        +getEnd()
        +setStart(pos: Position)
        +setEnd(pos: Position)
    }
    
    
    class Position{
        -col: int
        -line: int
        +Position(col: int, line: int): Position
        +getCol(): int
        +getLine(): int
    }

    class Write {
        -text: String
        -cur: Cursor
        -edit : editor
        +Write(cur: Cursor, edit: Editor, text: String): Write
    }

    class Delete {
        -cur: Cursor
        -edit : editor
        +Delete(cur: Cursor, edit: Editor): Delete
    }

    class Copy {
        -cur: Cursor
        -edit : editor
        -app: Application
        +Copy(cur: Cursor, edit: Editor, app: Application): Copy
    }

    class Paste {
        -cur: Cursor
        -edit : editor
        -app: Application
        +Paste(cur: Cursor, edit: Editor, app: Application): Paste
    }

    class MoveCursor {
        -cur: Cursor
        -pos: Position
        +MoveCursor(cur: Cursor, pos: Position): MoveCursor
    }

    class Suppr {
        -cur: Cursor
        -edit : editor
        +Suppr(cur: Cursor, edit: Editor): Suppr
    }

    class StartSelect {
        -pos: Position
        -cur: Cursor
        +StartSelect(cur: Cursor, pos: Position): StartSelect
    }

    class EndSelect {
        -pos: Position
        -cur: Cursor
        +EndSelect(cur: cursor, pos: Position): EndSelect
    }


    Cursor "1" <--* "1" Application
    
    Command <|-- Paste 
    Command <|-- Write 
    Command <|-- Copy 
    Command <|-- StartSelect 
    Command <|-- EndSelect 
    Command <|-- Delete
    Command <|-- Suppr
    Command <|-- MoveCursor


    Editor "1" <--* "1" Application
    Command "0..*" <--* "1" Application

    Paste "1" --> "1" Editor
    Write "1" --> "1"Editor
    Copy "1" --> "1" Editor
    StartSelect"1" --> "1" Cursor
    EndSelect "1" --> "1" Cursor 
    Delete "1" --> "1" Editor
    Suppr "1" --> "1" Editor
    MoveCursor "1" --> "1" Cursor

@enduml
``` 

## II.2 Diagramme séquence

```plantuml
@startuml

participant Application as app
participant Editor as edit
participant Cursor as cur
participant Command as com

group init (app constructor)
    app -> edit: new Editor()
    edit -> app: return instance
    app -> cur: new Cursor()
    cur -> app: return instance
end

group onWrite
    app -> com: new Write(app, "toto")
    com -> app: return instance
    app -> com: execute()
    com -> edit: editor.addStringBetween(text, cur.getStart(), cur.getEnd())
    edit -> com: return void
    com -> app: render()
    app -> com: return void
    com -> app: return void
end
group onDelete
    app -> com: new Delete(app)
    com -> app: return instance
    app -> com: execute()
    alt #Gold if cur.isSelection()
        com -> edit: editor.(cur.getStart(), cur.getEnd())
        edit -> com: return void
    else #LightBlue else
        com -> edit: deletBefore(cur.getStart())
        edit -> com: return void
    end
    com -> app: render()
    app -> com: return void
    com -> app: return void
end
group onCopy
    app -> com: new Copy(app)
    com -> app: return instance
    app -> com: execute()
    com -> edit: getStringBetween(cur.getStart(), cur.getEnd())
    edit -> com: return String
    com -> app: setClipboard(String)
    app -> com: return void
    com -> app: return void
end
group paste
    app -> com: new Paste(app)
    com -> app: return instance
    app -> com: execute()
    com -> app: getClipboard()
    app -> com: return String
    com -> edit: addStringBetween(clip, cur.getStart(), cur.getEnd())
    edit -> com: return void
    com -> app: render()
    app -> com: return void
    com -> app: return void
end

group selectLeft
    app -> com: new StartSelect(app)
    com -> app: return instance
    app -> com: execute()
    com -> cur: setStart(Position)
    cur -> com: return void
    com -> app: return void
    com -> app: return void
end

group selectRight
    app -> com: new EndSelect(app)
    com -> app: return instance
    app -> com: execute()
    com -> cur: setEnd(Position)
    cur -> com: return void
    com -> app: return void
    com -> app: return void
end



@enduml
``` 

## II.3 Diagramme d'état

```plantuml
@startuml
    class TODO{

    }
@enduml
``` 