# Node ID conflicts

> **Note that rename files are not available for atscm < v1.0.0.** Use `atscm update` to use the latest version

## How atscm handles id conflicts

Let's assume we have two atvise server nodes, *AGENT.OBJECT.conflictingnode* and *AGENT.OBJECT.ConflictingNode*. These are valid node ids on the server, but when stored to the (case-insensitive) filesystem, the behaviour is undefined.

When *atscm* discovers such a name conflict it creates a *rename file* at `./atscm/rename.json`. This file will contain a map where the conflicting ids stored against the name to use to resolve the conflict. by default *insert node name* is used, e.g.:

```json
{
  "AGENT.OBJECTS.ConflictingNode": "insert node name"
}
```

## How to resolve id conflicts

Once an id conflict is recognized and added to the rename file, it is your responsibility to provide non-conflicting node names, e.g.:

```json
{
  "AGENT.OBJECTS.ConflictingNode": "ConflictingNode-renamed"
}
```

After that **run `atscm pull` again** to pull the conflicting nodes.
